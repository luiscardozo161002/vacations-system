'use strict';

const repository = require('./repository');
const balance = require('./balance');
const db = require('../../db');
const { AppError } = require('../../lib/app-error');
const { EDITABLE_FIELDS, CREATE_FIELDS } = require('./fields');
const { scopeFrom, allowsEmployee } = require('../../lib/data-scope');
const { findEmployeeDetails } = require('../../lib/employee-details');
const { renderNoticePdf } = require('./pdf');
const entitlements = require('../vacation-entitlements/service');
const { notifyEmployee } = require('./notifications');

const REVIEW_PERMISSION = 'approvals:review';
const REGISTER_PERMISSION = 'notices:create';

const SCHEDULE_FIELDS = ['reason_id', 'absence_start_date', 'absence_end_date', 'absence_start_time', 'absence_end_time'];

const ACTIONS = {
  approve: { verb: 'aprobar', from: ['pending'], to: 'approved' },
  reject: { verb: 'rechazar', from: ['pending'], to: 'rejected' },
  cancel: { verb: 'cancelar', from: ['pending', 'approved'], to: 'cancelled', onlyBeforeStart: ['approved'] },
};

const OWNER_CANCEL = { verb: 'cancelar', from: ['pending'], to: 'cancelled' };

const STATUS_LABELS = {
  pending: 'pendiente',
  approved: 'aprobado',
  rejected: 'rechazado',
  cancelled: 'cancelado',
};

const pick = (data, fields) => {
  const result = {};
  for (const field of fields) {
    if (data[field] !== undefined) result[field] = data[field];
  }
  return result;
};

const takenFrom = (evaluation) => ({
  days_taken: evaluation.breakdown.days,
  hours_taken: evaluation.breakdown.hours,
});

const ensureEmployeeInScope = async (credentials, employeeId) => {
  if (!(await allowsEmployee(scopeFrom(credentials), employeeId))) {
    throw new AppError('INVALID_EMPLOYEE', 'El empleado no existe');
  }
};

const describeAll = async (notices) => {
  const employees = await findEmployeeDetails(notices.map((notice) => notice.employee_id));
  const reasons = new Map(
    (await db('reasons').whereIn('reason_id', [...new Set(notices.map((notice) => notice.reason_id))]).select('reason_id', 'description')).map(
      (reason) => [reason.reason_id, reason.description]
    )
  );

  return notices.map((notice) => {
    const employee = employees.get(notice.employee_id);
    return {
      ...notice,
      employee_name: employee?.employee_name ?? null,
      employee_number: employee?.employee_number ?? null,
      department_name: employee?.department_name ?? null,
      reason_description: reasons.get(notice.reason_id) ?? null,
    };
  });
};

const describe = async (notice) => (await describeAll([notice]))[0];

const list = async (filters, scope) => {
  const page = await repository.list(filters, scope);
  return { ...page, data: await describeAll(page.data) };
};

const findInScope = async (noticeId, scope) => {
  const notice = await repository.findById(noticeId, scope);
  if (!notice) throw new AppError('NOTICE_NOT_FOUND', 'El aviso no existe');
  return notice;
};

const findById = async (noticeId, scope) => describe(await findInScope(noticeId, scope));

const preview = async (data, credentials) => {
  await ensureEmployeeInScope(credentials, data.employee_id);
  return balance.toResponse(await balance.evaluate(db, data));
};

const create = async (data, credentials) => {
  await ensureEmployeeInScope(credentials, data.employee_id);
  const registersNotice = credentials.scope.includes(REGISTER_PERMISSION);

  const notice = await db.transaction(async (trx) => {
    const evaluation = await balance.evaluate(trx, data, { lock: registersNotice });
    balance.assertValid(evaluation);

    const record = { ...pick(data, CREATE_FIELDS), ...takenFrom(evaluation), created_by: credentials.user_id };

    if (!registersNotice) {
      return repository.create({ ...record, kind: 'request', status: 'pending' }, trx);
    }

    return repository.create(
      {
        ...record,
        kind: 'notice',
        status: 'approved',
        approved_by: credentials.user_id,
        approved_at: trx.fn.now(),
        entitlement_id: await balance.discount(trx, evaluation),
      },
      trx
    );
  });
  const described = await describe(notice);
  if (described.kind === 'notice') await notifyEmployee(described, credentials.user_id);
  return described;
};

const update = async (noticeId, data, scope) => {
  const current = await findInScope(noticeId, scope);
  const changes = pick(data, EDITABLE_FIELDS);

  if (!SCHEDULE_FIELDS.some((field) => changes[field] !== undefined)) {
    return describe(await repository.update(noticeId, changes, scope));
  }

  if (current.status !== 'pending') {
    throw new AppError('NOTICE_LOCKED', 'Solo se pueden cambiar fechas y motivo de un aviso pendiente');
  }

  const evaluation = await balance.evaluate(db, { ...current, ...changes });
  balance.assertValid(evaluation);
  return describe(await repository.update(noticeId, { ...changes, ...takenFrom(evaluation) }, scope));
};

const rejectionMessage = (rule, notice) => {
  if (rule.onlyBeforeStart?.includes(notice.status)) {
    return `No se puede ${rule.verb}: la ausencia ya empezó`;
  }
  return `No se puede ${rule.verb} un aviso ${STATUS_LABELS[notice.status]}`;
};

const applyBalance = async (trx, notice) => {
  if (notice.status === 'cancelled') {
    await balance.refund(trx, notice);
    return notice;
  }

  if (notice.status !== 'approved') return notice;

  const evaluation = await balance.evaluate(trx, notice, { lock: true });
  balance.assertValid(evaluation);
  return repository.patchById(
    notice.notice_id,
    { ...takenFrom(evaluation), entitlement_id: await balance.discount(trx, evaluation) },
    trx
  );
};

const resolve = async (noticeId, action, credentials) => {
  const scope = scopeFrom(credentials);
  await findInScope(noticeId, scope);
  const isReviewer = credentials.scope.includes(REVIEW_PERMISSION);

  if (isReviewer) {
    const allowed = await repository.findReviewActions(credentials.user_id);
    if (!allowed.includes(action)) {
      throw new AppError('REVIEW_ACTION_FORBIDDEN', `No tienes permitido ${ACTIONS[action].verb} avisos`);
    }
  }

  const rule = isReviewer ? ACTIONS[action] : OWNER_CANCEL;
  const patch = action === 'approve' ? { approved_by: credentials.user_id, approved_at: db.fn.now() } : {};

  const notice = await db.transaction(async (trx) => {
    const updated = await repository.transition(noticeId, rule, patch, trx);
    if (!updated) {
      throw new AppError('INVALID_TRANSITION', rejectionMessage(rule, await repository.findById(noticeId, scope)));
    }
    return applyBalance(trx, updated);
  });
  const described = await describe(notice);
  await notifyEmployee(described, credentials.user_id);
  return described;
};

const findCompany = (employeeId) =>
  db('employees as e')
    .join('departments as d', 'd.department_id', 'e.department_id')
    .join('branches as b', 'b.branch_id', 'd.branch_id')
    .join('company as c', 'c.company_id', 'b.company_id')
    .where('e.employee_id', employeeId)
    .first('c.company_name', 'c.rfc', 'c.logo', 'c.location', 'c.phone_number');

const pdf = async (noticeId, scope) => {
  const notice = await findById(noticeId, scope);
  if (notice.status !== 'approved') {
    throw new AppError('NOTICE_NOT_APPROVED', 'Solo se puede descargar el PDF de un aviso aprobado');
  }

  const [company, balances] = await Promise.all([
    findCompany(notice.employee_id),
    entitlements.list({ employee_id: notice.employee_id, status: 'active', sort: '-period_start', page: 1, pageSize: 1 }, scope),
  ]);
  return renderNoticePdf({ notice, company, balance: balances.data[0] ?? null });
};

module.exports = { list, findById, preview, create, update, resolve, pdf };
