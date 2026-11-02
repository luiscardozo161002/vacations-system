'use strict';

const ID_COLUMN = 'rule_id';
const EDITABLE_FIELDS = ['years_from', 'years_to', 'vacation_days', 'effective_year', 'status'];
const COLUMNS = [ID_COLUMN, ...EDITABLE_FIELDS, 'created_at'];

module.exports = { ID_COLUMN, EDITABLE_FIELDS, COLUMNS };
