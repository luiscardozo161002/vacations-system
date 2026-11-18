const CrudService = require('../../lib/crud/crud-service');
const repository = require('./repository');

module.exports = new CrudService({
  repository,
  editableFields: [],
  notFound: { code: 'AUTH_LOG_NOT_FOUND', message: 'El registro de auditoría no existe' },
});
