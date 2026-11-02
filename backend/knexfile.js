const config = require('./src/config');

module.exports = {
  development: {
    client: 'pg',
    connection: config.db,
    migrations: {
      directory: './src/db/migrations',
    },
    seeds: {
      directory: './src/db/seeds',
    },
  },
};
