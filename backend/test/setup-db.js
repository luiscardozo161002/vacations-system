require('./env');

const { Client } = require('pg');
const knex = require('knex');
const config = require('../src/config');
const knexConfig = require('../knexfile');

const createDatabaseIfMissing = async () => {
  const client = new Client({ ...config.db, database: 'postgres' });
  await client.connect();
  const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [config.db.database]);
  if (rowCount === 0) await client.query(`CREATE DATABASE "${config.db.database}"`);
  await client.end();
};

const main = async () => {
  await createDatabaseIfMissing();
  const db = knex(knexConfig.development);
  await db.migrate.latest();
  await db.seed.run();
  await db.destroy();
  console.log(`Base de pruebas lista: ${config.db.database}`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
