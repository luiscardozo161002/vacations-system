'use strict';

const VacationEntitlement = require('./model');
const { COLUMNS } = require('./fields');
const { buildOrderBy, paginationMeta } = require('../../lib/list-query');
const { forEmployees } = require('../../lib/data-scope');

const DEFAULT_SORT = [{ column: 'entitlement_id', order: 'asc' }];

const list = async ({ employee_id, period_year, status, sort, page = 1, pageSize = 20 }, scope) => {
  const query = VacationEntitlement.query().select(COLUMNS).orderBy(buildOrderBy(sort, COLUMNS, DEFAULT_SORT));
  forEmployees(query, scope, 'employee_id');

  if (employee_id !== undefined) query.where('employee_id', employee_id);
  if (period_year !== undefined) query.where('period_year', period_year);
  if (status !== undefined) query.where('status', status);

  const { results, total } = await query.page(page - 1, pageSize);

  return { data: results, pagination: paginationMeta(page, pageSize, total) };
};

const findById = (entitlementId, scope) =>
  forEmployees(VacationEntitlement.query().select(COLUMNS).where('entitlement_id', entitlementId), scope, 'employee_id').first();

const create = (data) => VacationEntitlement.query().insert(data).returning(COLUMNS);

const update = async (entitlementId, data, scope) => {
  const [entitlement] = await forEmployees(VacationEntitlement.query().where('entitlement_id', entitlementId), scope, 'employee_id')
    .patch(data)
    .returning(COLUMNS);
  return entitlement || null;
};

const remove = async (entitlementId, scope) => {
  const [entitlement] = await forEmployees(VacationEntitlement.query().where('entitlement_id', entitlementId), scope, 'employee_id')
    .patch({ status: 'inactive' })
    .returning(COLUMNS);
  return entitlement || null;
};

module.exports = { list, findById, create, update, remove };
