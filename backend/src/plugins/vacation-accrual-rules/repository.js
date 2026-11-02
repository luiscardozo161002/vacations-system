'use strict';

const VacationAccrualRule = require('./model');
const { COLUMNS } = require('./fields');

const list = async ({ status, effective_year, page = 1, pageSize = 20 }) => {
  const query = VacationAccrualRule.query().select(COLUMNS).orderBy('years_from');

  if (status !== undefined) query.where('status', status);
  if (effective_year !== undefined) query.where('effective_year', effective_year);

  const { results, total } = await query.page(page - 1, pageSize);

  return { data: results, pagination: { page, pageSize, total } };
};

const findById = (ruleId) => VacationAccrualRule.query().select(COLUMNS).findById(ruleId);

const create = (data) => VacationAccrualRule.query().insert(data).returning(COLUMNS);

const update = async (ruleId, data) => {
  const [rule] = await VacationAccrualRule.query().where('rule_id', ruleId).patch(data).returning(COLUMNS);
  return rule || null;
};

const remove = async (ruleId) => {
  const rule = await VacationAccrualRule.query().deleteById(ruleId).returning(COLUMNS);
  return rule || null;
};

module.exports = { list, findById, create, update, remove };
