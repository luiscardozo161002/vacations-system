'use strict';

const repository = require('./repository');
const db = require('../../db');
const { AppError } = require('../../lib/app-error');
const { EDITABLE_FIELDS, CREATE_FIELDS } = require('./fields');
const { scopeFrom, allowsEmployee } = require('../../lib/data-scope');

const REVIEW_PERMISSION = 'approvals:review';
const REGISTER_PERMISSION = 'notices:create';

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

const list = (filters, scope) => repository.list(filters, scope);

const findById = async (noticeId, scope) => {
  const notice = await repository.findById(noticeId, scope);
  if (!notice) throw new AppError('NOTICE_NOT_FOUND', 'El aviso no existe');
  return notice;
};

const create = async (data, credentials) => {
  if (!(await allowsEmployee(scopeFrom(credentials), data.employee_id))) {
    throw new AppError('INVALID_EMPLOYEE', 'El empleado no existe');
  }

  const record = { ...pick(data, CREATE_FIELDS), created_by: credentials.user_id };

  if (credentials.scope.includes(REGISTER_PERMISSION)) {
    return repository.create({
      ...record,
      kind: 'notice',
      status: 'approved',
      approved_by: credentials.user_id,
      approved_at: db.fn.now(),
    });
  }

  return repository.create({ ...record, kind: 'request', status: 'pending' });
};

const update = async (noticeId, data, scope) => {
  const notice = await repository.update(noticeId, pick(data, EDITABLE_FIELDS), scope);
  if (!notice) throw new AppError('NOTICE_NOT_FOUND', 'El aviso no existe');
  return notice;
};

const rejectionMessage = (rule, notice) => {
  if (rule.onlyBeforeStart?.includes(notice.status)) {
    return `No se puede ${rule.verb}: la ausencia ya empezó`;
  }
  return `No se puede ${rule.verb} un aviso ${STATUS_LABELS[notice.status]}`;
};

const resolve = async (noticeId, action, credentials) => {
  await findById(noticeId, scopeFrom(credentials));
  const isReviewer = credentials.scope.includes(REVIEW_PERMISSION);

  if (isReviewer) {
    const allowed = await repository.findReviewActions(credentials.user_id);
    if (!allowed.includes(action)) {
      throw new AppError('REVIEW_ACTION_FORBIDDEN', `No tienes permitido ${ACTIONS[action].verb} avisos`);
    }
  }

  const rule = isReviewer ? ACTIONS[action] : OWNER_CANCEL;
  const patch = action === 'approve' ? { approved_by: credentials.user_id, approved_at: db.fn.now() } : {};
  const updated = await repository.transition(noticeId, rule, patch);

  if (!updated) {
    const current = await repository.findById(noticeId, scopeFrom(credentials));
    throw new AppError('INVALID_TRANSITION', rejectionMessage(rule, current));
  }
  return updated;
};

module.exports = { list, findById, create, update, resolve };
