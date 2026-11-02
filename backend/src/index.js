const createServer = require('./server');

const init = async () => {
  const server = await createServer();
  await server.start();
  console.log(`Servidor disponible en ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
  console.error(err);
  process.exit(1);
});

init();
