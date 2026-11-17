const CrudRepository = require('../../lib/crud/crud-repository');
const Permission = require('./model');
const { COLUMNS } = require('./fields');

module.exports = new CrudRepository({ model: Permission, columns: COLUMNS, primaryKey: 'permission_id' });
