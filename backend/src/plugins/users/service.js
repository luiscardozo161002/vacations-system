'use strict';

const repository = require('./repository');
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

const list = (filters) => repository.list(filters);

const findById = async (userId) => {
  const user = await repository.findById(userId);
  if (!user) throw new AppError('USER_NOT_FOUND', 'El usuario no existe');
  return user;
};

const create = async (data) => {
  const payload = { ...pick(data), password_hash: await password.hash(data.password) };
  return repository.create(payload);
};

const update = async (userId, data) => {
  const payload = pick(data);
  if (data.password !== undefined) {
    payload.password_hash = await password.hash(data.password);
  }

  const user = await repository.update(userId, payload);
  if (!user) throw new AppError('USER_NOT_FOUND', 'El usuario no existe');
  return user;
};

const remove = async (userId) => {
  const user = await repository.remove(userId);
  if (!user) throw new AppError('USER_NOT_FOUND', 'El usuario no existe');
  return user;
};

module.exports = { list, findById, create, update, remove };
