'use strict';

const repository = require('./repository');
const db = require('../../db');
const { AppError } = require('../../lib/app-error');
const { EDITABLE_FIELDS } = require('./fields');
const { allowsBranch, allowsEmployee } = require('../../lib/data-scope');

const pick = (data) => {
  const result = {};
  for (const field of EDITABLE_FIELDS) {
    if (data[field] !== undefined) result[field] = data[field];
  }
  return result;
};

const checkReferences = async (data, scope) => {
  if (data.branch_id !== undefined && !(await allowsBranch(scope, data.branch_id))) {
    throw new AppError('INVALID_BRANCH', 'La sede no existe');
  }
  if (data.manager_employee_id != null && !(await allowsEmployee(scope, data.manager_employee_id))) {
    throw new AppError('INVALID_MANAGER', 'El empleado asignado como responsable no existe');
  }
};

const byKey = (rows, key) => new Map(rows.map((row) => [row[key], row]));

const describeAll = async (departments) => {
  const [counts, managers, branches] = await Promise.all([
    db('employees')
      .whereIn('department_id', departments.map((department) => department.department_id))
      .where('status', 'active')
      .groupBy('department_id')
      .select('department_id', db.raw('COUNT(*)::int AS total')),
    db('employees')
      .whereIn('employee_id', departments.map((department) => department.manager_employee_id).filter(Boolean))
      .select('employee_id', 'employee_name'),
    db('branches')
      .whereIn('branch_id', departments.map((department) => department.branch_id))
      .select('branch_id', 'code', 'branch_name'),
  ]);
  const countOf = byKey(counts, 'department_id');
  const managerOf = byKey(managers, 'employee_id');
  const branchOf = byKey(branches, 'branch_id');

  return departments.map((department) => ({
    ...department,
    manager_name: managerOf.get(department.manager_employee_id)?.employee_name ?? null,
    active_employees: countOf.get(department.department_id)?.total ?? 0,
    branch_code: branchOf.get(department.branch_id)?.code ?? null,
    branch_name: branchOf.get(department.branch_id)?.branch_name ?? null,
  }));
};

const describe = async (department) => (await describeAll([department]))[0];

const list = async (filters, scope) => {
  const page = await repository.list(filters, scope);
  return { ...page, data: await describeAll(page.data) };
};

const findById = async (departmentId, scope) => {
  const department = await repository.findById(departmentId, scope);
  if (!department) throw new AppError('DEPARTMENT_NOT_FOUND', 'El departamento no existe');
  return describe(department);
};

const create = async (data, scope) => {
  await checkReferences(data, scope);
  return describe(await repository.create(pick(data)));
};

const update = async (departmentId, data, scope) => {
  await checkReferences(data, scope);
  const department = await repository.update(departmentId, pick(data), scope);
  if (!department) throw new AppError('DEPARTMENT_NOT_FOUND', 'El departamento no existe');
  return describe(department);
};

const remove = async (departmentId, scope) => {
  const department = await repository.remove(departmentId, scope);
  if (!department) throw new AppError('DEPARTMENT_NOT_FOUND', 'El departamento no existe');
  return department;
};

module.exports = { list, findById, create, update, remove };
