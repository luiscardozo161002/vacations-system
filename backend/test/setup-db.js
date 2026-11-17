require('./env');

const { Client, escapeIdentifier } = require('pg');
const knex = require('knex');
const config = require('../src/config');
const knexConfig = require('../knexfile');

const createDatabaseIfMissing = async () => {
  const client = new Client({ ...config.db, database: 'postgres' });
  await client.connect();
  try {
    const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [config.db.database]);
    if (rowCount === 0) await client.query(`CREATE DATABASE ${escapeIdentifier(config.db.database)}`);
  } finally {
    await client.end();
  }
};

const main = async () => {
  await createDatabaseIfMissing();
  const db = knex(knexConfig.development);
  try {
    await db.migrate.latest();
    await db.seed.run();
  } finally {
    await db.destroy();
  }
  console.log(`Base de pruebas lista: ${config.db.database}`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
