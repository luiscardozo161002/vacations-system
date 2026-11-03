'use strict';

const ID_COLUMN = 'permission_id';
const EDITABLE_FIELDS = ['permission_code', 'description', 'status'];
const COLUMNS = [ID_COLUMN, ...EDITABLE_FIELDS];

module.exports = { ID_COLUMN, EDITABLE_FIELDS, COLUMNS };
