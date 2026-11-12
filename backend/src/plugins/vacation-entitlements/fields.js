'use strict';

const ID_COLUMN = 'entitlement_id';

const EDITABLE_FIELDS = [
  'employee_id',
  'period_year',
  'years_of_service',
  'rule_id',
  'total_days',
  'used_days',
  'used_hours',
  'period_start',
  'period_end',
  'status',
];
const COLUMNS = [ID_COLUMN, ...EDITABLE_FIELDS, 'generated_at'];

module.exports = { ID_COLUMN, EDITABLE_FIELDS, COLUMNS };
