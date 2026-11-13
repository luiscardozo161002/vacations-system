exports.up = async function (knex) {
  await knex.schema.alterTable('auth_audit_log', (table) => {
    table.string('result', 10).notNullable().defaultTo('success');
    table.check("result IN ('success','failed')", [], 'ck_auth_audit_log_result');
    table.string('entity', 40);
    table.string('entity_id', 40);
    table.string('request_id', 64);
    table.index(['created_at']);
  });
  await knex('auth_audit_log').whereLike('event_type', '%FAILED').update({ result: 'failed' });
};

exports.down = function (knex) {
  return knex.schema.alterTable('auth_audit_log', (table) => {
    table.dropIndex(['created_at']);
    table.dropChecks('ck_auth_audit_log_result');
    table.dropColumn('request_id');
    table.dropColumn('entity_id');
    table.dropColumn('entity');
    table.dropColumn('result');
  });
};
