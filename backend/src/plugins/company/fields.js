'use strict';

const ID_COLUMN = 'company_id';
const EDITABLE_FIELDS = ['folio', 'company_name', 'logo', 'location', 'phone_number', 'rfc', 'color', 'status'];
const COLUMNS = [ID_COLUMN, ...EDITABLE_FIELDS, 'created_at', 'updated_at'];

module.exports = { ID_COLUMN, EDITABLE_FIELDS, COLUMNS };
