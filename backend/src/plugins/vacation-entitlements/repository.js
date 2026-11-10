'use strict';

const VacationEntitlement = require('./model');
const { COLUMNS } = require('./fields');
const { buildOrderBy, paginationMeta } = require('../../lib/list-query');

const DEFAULT_SORT = [
  { column: 'employee_id', order: 'asc' },
  { column: 'period_year', order: 'asc' },
];

const list = async ({ employee_id, period_year, status, sort, page = 1, pageSize = 20 }) => {
  const query = VacationEntitlement.query().select(COLUMNS).orderBy(buildOrderBy(sort, COLUMNS, DEFAULT_SORT));

  if (employee_id !== undefined) query.where('employee_id', employee_id);
  if (period_year !== undefined) query.where('period_year', period_year);
  if (status !== undefined) query.where('status', status);

  const { results, total } = await query.page(page - 1, pageSize);

  return { data: results, pagination: paginationMeta(page, pageSize, total) };
};

const findById = (entitlementId) => VacationEntitlement.query().select(COLUMNS).findById(entitlementId);

const create = (data) => VacationEntitlement.query().insert(data).returning(COLUMNS);

const update = async (entitlementId, data) => {
  const [entitlement] = await VacationEntitlement.query()
    .where('entitlement_id', entitlementId)
    .patch(data)
    .returning(COLUMNS);
  return entitlement || null;
};

const remove = async (entitlementId) => {
  const [entitlement] = await VacationEntitlement.query()
    .where('entitlement_id', entitlementId)
    .patch({ status: 'inactive' })
    .returning(COLUMNS);
  return entitlement || null;
};

module.exports = { list, findById, create, update, remove };
