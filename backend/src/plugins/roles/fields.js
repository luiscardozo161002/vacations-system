'use strict';

const ID_COLUMN = 'role_id';
const EDITABLE_FIELDS = ['role_code', 'description', 'status'];
const COLUMNS = [ID_COLUMN, ...EDITABLE_FIELDS];

module.exports = { ID_COLUMN, EDITABLE_FIELDS, COLUMNS };
