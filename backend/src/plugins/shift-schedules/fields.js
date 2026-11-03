'use strict';

const ID_COLUMN = 'schedule_id';
const EDITABLE_FIELDS = ['shift_id', 'day_of_week', 'is_working_day', 'check_in_time', 'check_out_time', 'status'];
const COLUMNS = [ID_COLUMN, ...EDITABLE_FIELDS];

module.exports = { ID_COLUMN, EDITABLE_FIELDS, COLUMNS };
