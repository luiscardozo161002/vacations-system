'use strict';

const repository = require('./repository');
const db = require('../../db');
const { AppError } = require('../../lib/app-error');
const { EDITABLE_FIELDS } = require('./fields');

const pick = (data) => {
  const result = {};
  for (const field of EDITABLE_FIELDS) {
    if (data[field] !== undefined) result[field] = data[field];
  }
  return result;
};

const list = (filters) => repository.list(filters);

const findById = async (ruleId) => {
  const rule = await repository.findById(ruleId);
  if (!rule) throw new AppError('VACATION_RULE_NOT_FOUND', 'La regla de acumulación no existe');
  return rule;
};

const NO_UPPER_LIMIT = 999;

const checkRange = async (rule, ruleId = 0) => {
  if (rule.status === 'inactive') return;
  if (rule.years_to != null && rule.years_to < rule.years_from) {
    throw new AppError('INVALID_RULE_RANGE', 'La antigüedad "hasta" no puede ser menor que "desde"');
  }

  const overlapping = await db('vacation_accrual_rules')
    .where({ effective_year: rule.effective_year, status: 'active' })
    .whereNot('rule_id', ruleId)
    .where('years_from', '<=', rule.years_to ?? NO_UPPER_LIMIT)
    .where((upper) => upper.whereNull('years_to').orWhere('years_to', '>=', rule.years_from))
    .first('years_from', 'years_to');

  if (overlapping) {
    throw new AppError(
      'RULE_OVERLAP',
      `Se cruza con la regla de ${overlapping.years_from} a ${overlapping.years_to ?? 'más'} años`
    );
  }
};

const create = async (data) => {
  const rule = pick(data);
  await checkRange({ status: 'active', ...rule });
  return repository.create(rule);
};

const update = async (ruleId, data) => {
  const current = await findById(ruleId);
  await checkRange({ ...current, ...pick(data) }, ruleId);
  const rule = await repository.update(ruleId, pick(data));
  if (!rule) throw new AppError('VACATION_RULE_NOT_FOUND', 'La regla de acumulación no existe');
  return rule;
};

const remove = async (ruleId) => {
  const rule = await repository.remove(ruleId);
  if (!rule) throw new AppError('VACATION_RULE_NOT_FOUND', 'La regla de acumulación no existe');
  return rule;
};

module.exports = { list, findById, create, update, remove };
