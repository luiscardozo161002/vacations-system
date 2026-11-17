const CrudService = require('../../lib/crud/crud-service');
const repository = require('./repository');
const { EDITABLE_FIELDS } = require('./fields');

module.exports = new CrudService({
  repository,
  editableFields: EDITABLE_FIELDS,
  notFound: { code: 'REASON_NOT_FOUND', message: 'El motivo no existe' },
});
