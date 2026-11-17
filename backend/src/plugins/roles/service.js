const CrudService = require('../../lib/crud/crud-service');
const repository = require('./repository');
const { EDITABLE_FIELDS } = require('./fields');

module.exports = new CrudService({
  repository,
  editableFields: EDITABLE_FIELDS,
  notFound: { code: 'ROLE_NOT_FOUND', message: 'El rol no existe' },
});
