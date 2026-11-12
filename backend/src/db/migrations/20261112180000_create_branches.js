const COMPANIES = {
  JO: {
    folio: 'JOR',
    company_name: 'JUÁREZ DE ORIENTE S.A. DE C.V.',
    rfc: 'JOR070518U13',
    logo: 'https://i.ibb.co/1G6wdv02/Logo-JO-Profile.png',
    location: '4 Norte 8 B5, Col. Centro, Tecamachalco, Puebla, CP. 75480',
  },
  THH: {
    folio: 'THH',
    company_name: 'TRANSPORTES HIDRO HIDALGUENSES S.A. DE C.V.',
    rfc: 'THH981218DS0',
    logo: 'https://i.ibb.co/v8HXL7F/thh-oficial-copia.png',
    location: 'Av. Tulancingo, No. 103, San Miguel Vindhó, Tula de Allende, Hidalgo',
  },
  UMJ: {
    folio: 'UMJ',
    company_name: 'UNIDAD MÉDICA INTEGRAL HIDALGUENSE, C.J. S.A. de C.V.',
    rfc: 'UMI1007285C1',
    logo: 'https://i.ibb.co/n8sQ05Xq/umj-logo-transparente.png',
    location: 'Zimapán s/n, Colonia San Miguel Vindhó, Tula de Allende, Hidalgo C.P. 42842',
  },
};

const BRANCH_CODES = { JO_HGO: 'JOR_HGO', JO_PUE: 'JOR_PUEB', JO_CAM: 'JOR_CAMP' };

const MISSING_BRANCHES = [{ prefix: 'THH', code: 'THH_PUE', branch_name: 'Puebla' }];

const prefixOf = (folio) => folio.split('_')[0];

exports.up = async function (knex) {
  await knex.schema.createTable('branches', (table) => {
    table.increments('branch_id').primary();
    table.integer('company_id').notNullable().references('company_id').inTable('company');
    table.string('code', 20).notNullable().unique();
    table.string('branch_name', 100).notNullable();
    table.string('status', 20).notNullable().defaultTo('active');
    table.check("status IN ('active','inactive')", [], 'ck_branches_status');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('user_branches', (table) => {
    table.integer('user_id').notNullable().references('user_id').inTable('users').onDelete('CASCADE');
    table.integer('branch_id').notNullable().references('branch_id').inTable('branches');
    table.primary(['user_id', 'branch_id'], { constraintName: 'pk_user_branches' });
  });

  await knex.schema.alterTable('departments', (table) => {
    table.integer('branch_id').references('branch_id').inTable('branches');
  });

  const rows = await knex('company').orderBy('company_id');
  const canonical = {};

  for (const row of rows) {
    const prefix = prefixOf(row.folio);
    canonical[prefix] = canonical[prefix] || row;

    const [{ branch_id }] = await knex('branches')
      .insert({
        company_id: canonical[prefix].company_id,
        code: BRANCH_CODES[row.folio] || row.folio,
        branch_name: row.company_branch || row.folio,
        status: row.status,
      })
      .returning('branch_id');

    await knex('departments').where({ company_id: row.company_id }).update({ branch_id });
  }

  for (const branch of MISSING_BRANCHES) {
    const company = canonical[branch.prefix];
    if (company) {
      await knex('branches')
        .insert({ company_id: company.company_id, code: branch.code, branch_name: branch.branch_name })
        .onConflict('code')
        .ignore();
    }
  }

  await knex.schema.alterTable('departments', (table) => {
    table.dropUnique(['company_id', 'code'], 'uq_departments_company_code');
    table.dropColumn('company_id');
  });
  await knex.schema.alterTable('departments', (table) => {
    table.integer('branch_id').notNullable().alter();
    table.unique(['branch_id', 'code'], { indexName: 'uq_departments_branch_code' });
  });

  const keptIds = Object.values(canonical).map((row) => row.company_id);
  await knex('company').whereNotIn('company_id', keptIds).del();

  for (const [prefix, row] of Object.entries(canonical)) {
    await knex('company')
      .where({ company_id: row.company_id })
      .update({ folio: prefix, ...COMPANIES[prefix], updated_at: knex.fn.now() });
  }

  await knex.schema.alterTable('company', (table) => {
    table.dropColumn('company_branch');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('company', (table) => {
    table.string('company_branch', 100);
  });
  await knex.schema.alterTable('departments', (table) => {
    table.integer('company_id').references('company_id').inTable('company');
  });

  const branches = await knex('branches').orderBy('branch_id');
  const reused = new Set();

  for (const branch of branches) {
    let companyId = branch.company_id;

    if (reused.has(companyId)) {
      const company = await knex('company').where({ company_id: companyId }).first();
      const [inserted] = await knex('company')
        .insert({
          folio: branch.code,
          company_name: company.company_name,
          company_branch: branch.branch_name,
          logo: company.logo,
          location: company.location,
          phone_number: company.phone_number,
          status: branch.status,
        })
        .returning('company_id');
      companyId = inserted.company_id;
    } else {
      reused.add(companyId);
      await knex('company').where({ company_id: companyId }).update({ folio: branch.code, company_branch: branch.branch_name });
    }

    await knex('departments').where({ branch_id: branch.branch_id }).update({ company_id: companyId });
  }

  await knex.schema.alterTable('departments', (table) => {
    table.dropUnique(['branch_id', 'code'], 'uq_departments_branch_code');
    table.dropForeign(['branch_id']);
    table.dropColumn('branch_id');
  });
  await knex.schema.alterTable('departments', (table) => {
    table.integer('company_id').notNullable().alter();
    table.unique(['company_id', 'code'], { indexName: 'uq_departments_company_code' });
  });

  await knex.schema.dropTable('user_branches');
  await knex.schema.dropTable('branches');
};
