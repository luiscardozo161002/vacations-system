'use strict';

const repository = require('./repository');
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

const create = (data) => repository.create(pick(data));

const update = async (ruleId, data) => {
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
