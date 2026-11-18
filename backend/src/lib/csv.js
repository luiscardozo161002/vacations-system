const config = require('../config');

class CsvWriter {
  quote(value) {
    return `"${String(value ?? '').replace(/"/g, '""')}"`;
  }

  write(rows) {
    return config.csv.bom + rows.map((row) => row.map((value) => this.quote(value)).join(',')).join('\r\n');
  }
}

module.exports = new CsvWriter();
