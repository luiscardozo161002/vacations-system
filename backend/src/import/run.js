'use strict';

const fs = require('fs');
const path = require('path');
const db = require('../db');
const { importEmployees, toReportCsv } = require('./employees');

const BOM = '\uFEFF';
const USAGE = 'Uso: npm run import:employees --workspace=backend -- <archivo.csv> [--simular] [--accesos]';

const main = async () => {
  const args = process.argv.slice(2);
  const file = args.find((arg) => !arg.startsWith('--'));
  if (!file) throw new Error(USAGE);

  const simulate = args.includes('--simular');
  const report = await importEmployees(fs.readFileSync(file, 'utf8'), {
    simulate,
    createAccess: args.includes('--accesos'),
  });

  const output = path.join(path.dirname(file), `${path.basename(file, path.extname(file))}.reporte.csv`);
  fs.writeFileSync(output, BOM + toReportCsv(report));

  const count = (result) => report.filter((entry) => entry.result === result).length;
  console.log(
    simulate
      ? `Simulación sin guardar. Filas: ${report.length} · válidas: ${count('valido')} · rechazadas: ${count('rechazado')}`
      : `Importación. Filas: ${report.length} · creadas: ${count('creado')} · actualizadas: ${count('actualizado')} · rechazadas: ${count('rechazado')}`,
  );
  report
    .filter((entry) => entry.result === 'rechazado')
    .forEach((entry) => console.log(`  Fila ${entry.line} (${entry.row.numero_empleado ?? ''}): ${entry.detail}`));
  console.log(`Reporte: ${output}`);
  if (report.some((entry) => entry.temporaryPassword)) {
    console.log('El reporte trae contraseñas temporales: entrégalas y borra el archivo.');
  }
};

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => db.destroy());
