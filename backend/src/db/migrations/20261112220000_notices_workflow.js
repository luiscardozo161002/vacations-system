exports.up = async function (knex) {
  await knex.schema.alterTable('notices', (table) => {
    table.string('kind', 10).notNullable().defaultTo('request');
    table.check("kind IN ('request','notice')", [], 'ck_notices_kind');
    table.integer('created_by').references('user_id').inTable('users');
  });

  await knex.schema.alterTable('users', (table) => {
    table.specificType('review_actions', 'text[]').notNullable().defaultTo(knex.raw("'{approve,reject,cancel}'"));
    table.check("review_actions <@ ARRAY['approve','reject','cancel']::text[]", [], 'ck_users_review_actions');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('users', (table) => {
    table.dropChecks('ck_users_review_actions');
    table.dropColumn('review_actions');
  });

  await knex.schema.alterTable('notices', (table) => {
    table.dropChecks('ck_notices_kind');
    table.dropColumn('created_by');
    table.dropColumn('kind');
  });
};
