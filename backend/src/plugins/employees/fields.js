'use strict';

const ID_COLUMN = 'employee_id';
const EDITABLE_FIELDS = [
  'department_id',
  'shift_id',
  'folio',
  'employee_number',
  'employee_name',
  'start_date',
  'status',
];
const COLUMNS = [ID_COLUMN, ...EDITABLE_FIELDS, 'created_at', 'updated_at'];

module.exports = { ID_COLUMN, EDITABLE_FIELDS, COLUMNS };
