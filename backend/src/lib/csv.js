const BOM = '﻿';

class CsvWriter {
  quote(value) {
    return `"${String(value ?? '').replace(/"/g, '""')}"`;
  }

  write(rows) {
    return BOM + rows.map((row) => row.map((value) => this.quote(value)).join(',')).join('\r\n');
  }
}

module.exports = new CsvWriter();
