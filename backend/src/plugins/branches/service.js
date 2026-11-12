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

const describeAll = async (branches) => {
  const counts = await db('employees as e')
    .join('departments as d', 'd.department_id', 'e.department_id')
    .whereIn('d.branch_id', branches.map((branch) => branch.branch_id))
    .where('e.status', 'active')
    .groupBy('d.branch_id')
    .select('d.branch_id', db.raw('COUNT(*)::int AS total'));
  const countOf = new Map(counts.map((row) => [row.branch_id, row.total]));

  return branches.map((branch) => ({ ...branch, active_employees: countOf.get(branch.branch_id) ?? 0 }));
};

const list = async (filters, scope) => {
  const page = await repository.list(filters, scope);
  return { ...page, data: await describeAll(page.data) };
};

const findById = async (branchId, scope) => {
  const branch = await repository.findById(branchId, scope);
  if (!branch) throw new AppError('BRANCH_NOT_FOUND', 'La sede no existe');
  return (await describeAll([branch]))[0];
};

const create = (data) => repository.create(pick(data));

const update = async (branchId, data, scope) => {
  const branch = await repository.update(branchId, pick(data), scope);
  if (!branch) throw new AppError('BRANCH_NOT_FOUND', 'La sede no existe');
  return branch;
};

const remove = async (branchId, scope) => {
  const branch = await repository.remove(branchId, scope);
  if (!branch) throw new AppError('BRANCH_NOT_FOUND', 'La sede no existe');
  return branch;
};

module.exports = { list, findById, create, update, remove };
