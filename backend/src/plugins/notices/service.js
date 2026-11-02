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

const findById = async (noticeId) => {
  const notice = await repository.findById(noticeId);
  if (!notice) throw new AppError('NOTICE_NOT_FOUND', 'El aviso no existe');
  return notice;
};

const create = (data) => repository.create(pick(data));

const update = async (noticeId, data) => {
  const notice = await repository.update(noticeId, pick(data));
  if (!notice) throw new AppError('NOTICE_NOT_FOUND', 'El aviso no existe');
  return notice;
};

const remove = async (noticeId) => {
  const notice = await repository.remove(noticeId);
  if (!notice) throw new AppError('NOTICE_NOT_FOUND', 'El aviso no existe');
  return notice;
};

module.exports = { list, findById, create, update, remove };
