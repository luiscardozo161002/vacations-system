'use strict';

const BOM = '\uFEFF';

const quote = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const toCsv = (rows) => BOM + rows.map((row) => row.map(quote).join(',')).join('\r\n');

module.exports = { toCsv };
