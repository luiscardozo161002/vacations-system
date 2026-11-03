const TABLES = [
  { table: 'reasons', checkName: 'ck_reasons_status' },
  { table: 'permissions', checkName: 'ck_permissions_status' },
  { table: 'shift_schedules', checkName: 'ck_shift_schedules_status' },
  { table: 'vacation_entitlements', checkName: 'ck_vacation_entitlements_status' },
  { table: 'role_permissions', checkName: 'ck_role_permissions_status' },
];

exports.up = async function (knex) {
  for (const { table, checkName } of TABLES) {
    await knex.schema.alterTable(table, (t) => {
      t.string('status', 20).notNullable().defaultTo('active');
      t.check("status IN ('active','inactive')", [], checkName);
    });
  }
};

exports.down = async function (knex) {
  for (const { table, checkName } of TABLES) {
    await knex.schema.alterTable(table, (t) => {
      t.dropChecks(checkName);
      t.dropColumn('status');
    });
  }
};
