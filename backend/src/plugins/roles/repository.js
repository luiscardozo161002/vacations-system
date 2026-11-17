const CrudRepository = require('../../lib/crud/crud-repository');
const Role = require('./model');
const { COLUMNS } = require('./fields');

module.exports = new CrudRepository({ model: Role, columns: COLUMNS, primaryKey: 'role_id' });
