const knex = require('knex');
const { Model } = require('objection');
const knexConfig = require('../../knexfile');

const db = knex(knexConfig.development);

Model.knex(db);

module.exports = db;
