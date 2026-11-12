'use strict';

const ID_COLUMN = 'notice_id';
const EDITABLE_FIELDS = [
  'reason_id',
  'absence_start_date',
  'absence_end_date',
  'absence_start_time',
  'absence_end_time',
  'remarks',
];
const CREATE_FIELDS = ['employee_id', ...EDITABLE_FIELDS];
const COLUMNS = [
  ID_COLUMN,
  'employee_id',
  'kind',
  'status',
  ...EDITABLE_FIELDS,
  'days_taken',
  'hours_taken',
  'entitlement_id',
  'created_by',
  'approved_by',
  'approved_at',
  'request_date',
];

module.exports = { ID_COLUMN, EDITABLE_FIELDS, CREATE_FIELDS, COLUMNS };
