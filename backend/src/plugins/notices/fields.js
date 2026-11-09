'use strict';

const ID_COLUMN = 'notice_id';
const EDITABLE_FIELDS = [
  'employee_id',
  'reason_id',
  'approved_by',
  'status',
  'absence_start_date',
  'absence_end_date',
  'absence_start_time',
  'absence_end_time',
  'remaining_days',
  'remaining_hours',
  'remarks',
  'approved_at',
];
const COLUMNS = [ID_COLUMN, ...EDITABLE_FIELDS, 'request_date'];

module.exports = { ID_COLUMN, EDITABLE_FIELDS, COLUMNS };
