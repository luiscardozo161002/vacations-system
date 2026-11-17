const resetSequence = (knex, table, column) =>
  knex.raw('SELECT setval(pg_get_serial_sequence(?, ?), (SELECT MAX(??) FROM ??))', [table, column, column, table]);

module.exports = { resetSequence };
