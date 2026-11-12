'use strict';

const ID_COLUMN = 'department_id';
const EDITABLE_FIELDS = ['branch_id', 'code', 'department_name', 'manager_employee_id', 'status'];
const COLUMNS = [ID_COLUMN, ...EDITABLE_FIELDS, 'created_at', 'updated_at'];

module.exports = { ID_COLUMN, EDITABLE_FIELDS, COLUMNS };
