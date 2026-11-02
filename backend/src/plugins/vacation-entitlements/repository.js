'use strict';

const VacationEntitlement = require('./model');
const { COLUMNS } = require('./fields');

const list = async ({ employee_id, period_year, page = 1, pageSize = 20 }) => {
  const query = VacationEntitlement.query().select(COLUMNS).orderBy(['employee_id', 'period_year']);

  if (employee_id !== undefined) query.where('employee_id', employee_id);
  if (period_year !== undefined) query.where('period_year', period_year);

  const { results, total } = await query.page(page - 1, pageSize);

  return { data: results, pagination: { page, pageSize, total } };
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
  const entitlement = await VacationEntitlement.query().deleteById(entitlementId).returning(COLUMNS);
  return entitlement || null;
};

module.exports = { list, findById, create, update, remove };
