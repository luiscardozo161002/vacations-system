'use strict';

const repository = require('./repository');
const db = require('../../db');
const { AppError } = require('../../lib/app-error');
const password = require('../../lib/password');
const { EDITABLE_FIELDS } = require('./fields');

const pick = (data) => {
  const result = {};
  for (const field of EDITABLE_FIELDS) {
    if (data[field] !== undefined) result[field] = data[field];
  }
  return result;
};

const describeAll = async (users) => {
  const [roles, employees, branches] = await Promise.all([
    db('roles').whereIn('role_id', users.map((user) => user.role_id)).select('role_id', 'role_code'),
    db('employees').whereIn('employee_id', users.map((user) => user.employee_id).filter(Boolean)).select('employee_id', 'employee_name'),
    db('user_branches as ub')
      .join('branches as b', 'b.branch_id', 'ub.branch_id')
      .whereIn('ub.user_id', users.map((user) => user.user_id))
      .orderBy('b.branch_id')
      .select('ub.user_id', 'b.code'),
  ]);
  const roleOf = new Map(roles.map((role) => [role.role_id, role.role_code]));
  const employeeOf = new Map(employees.map((employee) => [employee.employee_id, employee.employee_name]));

  return users.map((user) => ({
    ...user,
    role_code: roleOf.get(user.role_id) ?? null,
    employee_name: employeeOf.get(user.employee_id) ?? null,
    branch_codes: branches.filter((branch) => branch.user_id === user.user_id).map((branch) => branch.code),
  }));
};

const describe = async (user) => (await describeAll([user]))[0];

const list = async (filters) => {
  const page = await repository.list(filters);
  return { ...page, data: await describeAll(page.data) };
};

const findStored = async (userId) => {
  const user = await repository.findById(userId);
  if (!user) throw new AppError('USER_NOT_FOUND', 'El usuario no existe');
  return user;
};

const findById = async (userId) => describe(await findStored(userId));

const create = async (data) => {
  const payload = { ...pick(data), password_hash: await password.hash(data.password) };
  return describe(await repository.create(payload));
};

const update = async (userId, data) => {
  const payload = pick(data);
  if (data.password !== undefined) {
    payload.password_hash = await password.hash(data.password);
  }

  const user = await repository.update(userId, payload);
  if (!user) throw new AppError('USER_NOT_FOUND', 'El usuario no existe');
  return describe(user);
};

const remove = async (userId) => {
  const user = await repository.remove(userId);
  if (!user) throw new AppError('USER_NOT_FOUND', 'El usuario no existe');
  return user;
};

const findBranches = async (userId) => {
  await findStored(userId);
  return repository.findBranches(userId);
};

const replaceBranches = async (userId, branchIds) => {
  await findStored(userId);
  await repository.replaceBranches(userId, [...new Set(branchIds)]);
  return repository.findBranches(userId);
};

module.exports = { list, findById, create, update, remove, findBranches, replaceBranches };
