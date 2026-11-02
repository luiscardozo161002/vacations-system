'use strict';

const ID_COLUMN = 'shift_id';
const EDITABLE_FIELDS = ['code', 'shift_name', 'number_days', 'status'];
const COLUMNS = [ID_COLUMN, ...EDITABLE_FIELDS, 'created_at', 'updated_at'];

module.exports = { ID_COLUMN, EDITABLE_FIELDS, COLUMNS };
