'use strict';

const db = require('../../db');
const Employee = require('./model');
const { COLUMNS } = require('./fields');

const list = async ({ department_id, status, page = 1, pageSize = 10 }) => {
  const query = Employee.query().select(COLUMNS).orderBy('employee_id');

  if (department_id !== undefined) query.where('department_id', department_id);
  if (status !== undefined) query.where('status', status);

  const { results, total } = await query.page(page - 1, pageSize);

  return { data: results, pagination: { page, pageSize, total } };
};

const findById = (employeeId) => Employee.query().select(COLUMNS).findById(employeeId);

const create = (data) => Employee.query().insert(data).returning(COLUMNS);

const update = async (employeeId, data) => {
  const [employee] = await Employee.query()
    .where('employee_id', employeeId)
    .patch({ ...data, updated_at: db.fn.now() })
    .returning(COLUMNS);
  return employee || null;
};

const remove = async (employeeId) => {
  const employee = await Employee.query().deleteById(employeeId).returning(COLUMNS);
  return employee || null;
};

module.exports = { list, findById, create, update, remove };
