'use strict';

const ID_COLUMN = 'reason_id';
const EDITABLE_FIELDS = ['description', 'requires_approval', 'affects_vacation_balance', 'status'];
const COLUMNS = [ID_COLUMN, ...EDITABLE_FIELDS];

module.exports = { ID_COLUMN, EDITABLE_FIELDS, COLUMNS };
