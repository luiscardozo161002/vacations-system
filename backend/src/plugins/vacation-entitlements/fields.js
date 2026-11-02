'use strict';

const ID_COLUMN = 'entitlement_id';

// remaining_days es una columna generada por Postgres (total_days - used_days): nunca se inserta ni se actualiza.
const EDITABLE_FIELDS = ['employee_id', 'period_year', 'years_of_service', 'rule_id', 'total_days', 'used_days'];
const COLUMNS = [ID_COLUMN, ...EDITABLE_FIELDS, 'remaining_days', 'generated_at'];

module.exports = { ID_COLUMN, EDITABLE_FIELDS, COLUMNS };
