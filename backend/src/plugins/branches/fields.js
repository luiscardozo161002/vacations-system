'use strict';

const ID_COLUMN = 'branch_id';
const EDITABLE_FIELDS = ['company_id', 'code', 'branch_name', 'status'];
const COLUMNS = [ID_COLUMN, ...EDITABLE_FIELDS, 'created_at', 'updated_at'];

module.exports = { ID_COLUMN, EDITABLE_FIELDS, COLUMNS };
