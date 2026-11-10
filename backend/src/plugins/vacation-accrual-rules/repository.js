'use strict';

const VacationAccrualRule = require('./model');
const { COLUMNS } = require('./fields');
const { buildOrderBy, paginationMeta } = require('../../lib/list-query');

const DEFAULT_SORT = [{ column: 'years_from', order: 'asc' }];

const list = async ({ status, effective_year, sort, page = 1, pageSize = 20 }) => {
  const query = VacationAccrualRule.query().select(COLUMNS).orderBy(buildOrderBy(sort, COLUMNS, DEFAULT_SORT));

  if (status !== undefined) query.where('status', status);
  if (effective_year !== undefined) query.where('effective_year', effective_year);

  const { results, total } = await query.page(page - 1, pageSize);

  return { data: results, pagination: paginationMeta(page, pageSize, total) };
};

const findById = (ruleId) => VacationAccrualRule.query().select(COLUMNS).findById(ruleId);

const create = (data) => VacationAccrualRule.query().insert(data).returning(COLUMNS);

const update = async (ruleId, data) => {
  const [rule] = await VacationAccrualRule.query().where('rule_id', ruleId).patch(data).returning(COLUMNS);
  return rule || null;
};

const remove = async (ruleId) => {
  const [rule] = await VacationAccrualRule.query()
    .where('rule_id', ruleId)
    .patch({ status: 'inactive' })
    .returning(COLUMNS);
  return rule || null;
};

module.exports = { list, findById, create, update, remove };
