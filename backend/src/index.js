const { setInterval } = require('node:timers');
const createServer = require('./server');
const config = require('./config');
const { rollover } = require('./plugins/vacation-entitlements/rollover');

const DAY_MS = 24 * 60 * 60 * 1000;

const runRollover = () =>
  rollover()
    .then(({ date, created, expired, cancelled_requests, reminders, skipped }) =>
      console.log(
        `Periodos ${date}: ${created} abiertos, ${expired} vencidos, ${cancelled_requests} solicitudes canceladas, ${reminders} avisos, ${skipped.length} omitidos`
      )
    )
    .catch((err) => console.error('No se pudieron generar los periodos', err));

const init = async () => {
  const server = await createServer();
  await server.start();
  console.log(`Servidor disponible en ${server.info.uri}`);

  if (config.env !== 'test') {
    runRollover();
    setInterval(runRollover, DAY_MS);
  }
};

process.on('unhandledRejection', (err) => {
  console.error(err);
  process.exit(1);
});

init();
