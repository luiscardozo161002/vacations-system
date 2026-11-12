'use strict';

const repository = require('./repository');
const { AppError } = require('../../lib/app-error');

const list = (filters) => repository.list(filters);

const findById = async (logId) => {
  const entry = await repository.findById(logId);
  if (!entry) throw new AppError('AUTH_LOG_NOT_FOUND', 'El registro de auditoría no existe');
  return entry;
};

module.exports = { list, findById };
