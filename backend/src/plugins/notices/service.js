const CrudService = require('../../lib/crud/crud-service');
const repository = require('./repository');
const balance = require('./balance');
const notifier = require('./notifications');
const noticePdf = require('./pdf');
const db = require('../../db');
const { AppError } = require('../../lib/app-error');
const { EDITABLE_FIELDS, CREATE_FIELDS } = require('./fields');
const { scopeFrom, allowsEmployee } = require('../../lib/data-scope');
const { findEmployeeDetails } = require('../../lib/employee-details');
const entitlements = require('../vacation-entitlements/service');

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

const takenFrom = (evaluation) => ({
  days_taken: evaluation.breakdown.days,
  hours_taken: evaluation.breakdown.hours,
});

class NoticeService extends CrudService {
  constructor({ balance, notifier, noticePdf, entitlements, ...crud }) {
    super(crud);
    this.balance = balance;
    this.notifier = notifier;
    this.noticePdf = noticePdf;
    this.entitlements = entitlements;
  }

  async ensureEmployeeInScope(credentials, employeeId) {
    if (!(await allowsEmployee(scopeFrom(credentials), employeeId))) {
      throw new AppError('INVALID_EMPLOYEE', 'El empleado no existe');
    }
  }

  async describeAll(notices) {
    const employees = await findEmployeeDetails(notices.map((notice) => notice.employee_id));
    const reasonIds = [...new Set(notices.map((notice) => notice.reason_id))];
    const reasons = new Map(
      (await db('reasons').whereIn('reason_id', reasonIds).select('reason_id', 'description')).map((reason) => [
        reason.reason_id,
        reason.description,
      ])
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
  }

  async describe(notice) {
    return (await this.describeAll([notice]))[0];
  }

  async list(filters, scope) {
    const page = await super.list(filters, scope);
    return { ...page, data: await this.describeAll(page.data) };
  }

  findInScope(id, scope) {
    return super.findById(id, scope);
  }

  async findById(id, scope) {
    return this.describe(await this.findInScope(id, scope));
  }

  async preview(data, credentials) {
    await this.ensureEmployeeInScope(credentials, data.employee_id);
    return this.balance.toResponse(await this.balance.evaluate(db, data));
  }

  async create(data, credentials) {
    await this.ensureEmployeeInScope(credentials, data.employee_id);
    const registersNotice = credentials.scope.includes(REGISTER_PERMISSION);

    const notice = await db.transaction(async (trx) => {
      const evaluation = await this.balance.evaluate(trx, data, { lock: registersNotice });
      this.balance.assertValid(evaluation);

      const record = { ...this.pick(data, CREATE_FIELDS), ...takenFrom(evaluation), created_by: credentials.user_id };

      if (!registersNotice) {
        return this.repository.create({ ...record, kind: 'request', status: 'pending' }, trx);
      }

      return this.repository.create(
        {
          ...record,
          kind: 'notice',
          status: 'approved',
          approved_by: credentials.user_id,
          approved_at: trx.fn.now(),
          entitlement_id: await this.balance.discount(trx, evaluation),
        },
        trx
      );
    });
    const described = await this.describe(notice);
    if (described.kind === 'notice') await this.notifier.notifyEmployee(described, credentials.user_id);
    return described;
  }

  async update(id, data, scope) {
    const current = await this.findInScope(id, scope);
    const changes = this.pick(data, EDITABLE_FIELDS);

    if (!SCHEDULE_FIELDS.some((field) => changes[field] !== undefined)) {
      return this.describe(await this.repository.update(id, changes, scope));
    }

    if (current.status !== 'pending') {
      throw new AppError('NOTICE_LOCKED', 'Solo se pueden cambiar fechas y motivo de un aviso pendiente');
    }

    const evaluation = await this.balance.evaluate(db, { ...current, ...changes });
    this.balance.assertValid(evaluation);
    return this.describe(await this.repository.update(id, { ...changes, ...takenFrom(evaluation) }, scope));
  }

  rejectionMessage(rule, notice) {
    if (rule.onlyBeforeStart?.includes(notice.status)) {
      return `No se puede ${rule.verb}: la ausencia ya empezó`;
    }
    return `No se puede ${rule.verb} un aviso ${STATUS_LABELS[notice.status]}`;
  }

  async applyBalance(trx, notice) {
    if (notice.status === 'cancelled') {
      await this.balance.refund(trx, notice);
      return notice;
    }

    if (notice.status !== 'approved') return notice;

    const evaluation = await this.balance.evaluate(trx, notice, { lock: true });
    this.balance.assertValid(evaluation);
    return this.repository.patchById(
      notice.notice_id,
      { ...takenFrom(evaluation), entitlement_id: await this.balance.discount(trx, evaluation) },
      trx
    );
  }

  async resolve(id, action, credentials) {
    const scope = scopeFrom(credentials);
    await this.findInScope(id, scope);
    const isReviewer = credentials.scope.includes(REVIEW_PERMISSION);

    if (isReviewer) {
      const allowed = await this.repository.findReviewActions(credentials.user_id);
      if (!allowed.includes(action)) {
        throw new AppError('REVIEW_ACTION_FORBIDDEN', `No tienes permitido ${ACTIONS[action].verb} avisos`);
      }
    }

    const rule = isReviewer ? ACTIONS[action] : OWNER_CANCEL;
    const patch = action === 'approve' ? { approved_by: credentials.user_id, approved_at: db.fn.now() } : {};

    const notice = await db.transaction(async (trx) => {
      const updated = await this.repository.transition(id, rule, patch, trx);
      if (!updated) {
        throw new AppError('INVALID_TRANSITION', this.rejectionMessage(rule, await this.repository.findById(id, scope)));
      }
      return this.applyBalance(trx, updated);
    });
    const described = await this.describe(notice);
    await this.notifier.notifyEmployee(described, credentials.user_id);
    return described;
  }

  findCompany(employeeId) {
    return db('employees as e')
      .join('departments as d', 'd.department_id', 'e.department_id')
      .join('branches as b', 'b.branch_id', 'd.branch_id')
      .join('company as c', 'c.company_id', 'b.company_id')
      .where('e.employee_id', employeeId)
      .first('c.company_name', 'c.rfc', 'c.logo', 'c.location', 'c.phone_number');
  }

  async pdf(id, scope) {
    const notice = await this.findById(id, scope);
    if (notice.status !== 'approved') {
      throw new AppError('NOTICE_NOT_APPROVED', 'Solo se puede descargar el PDF de un aviso aprobado');
    }

    const [company, balances] = await Promise.all([
      this.findCompany(notice.employee_id),
      this.entitlements.list(
        { employee_id: notice.employee_id, status: 'active', sort: '-period_start', page: 1, pageSize: 1 },
        scope
      ),
    ]);
    return this.noticePdf.render({ notice, company, balance: balances.data[0] ?? null });
  }
}

module.exports = new NoticeService({
  repository,
  balance,
  notifier,
  noticePdf,
  entitlements,
  editableFields: EDITABLE_FIELDS,
  notFound: { code: 'NOTICE_NOT_FOUND', message: 'El aviso no existe' },
});
