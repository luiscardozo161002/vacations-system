const knex = require('knex');
const { types } = require('pg');
const { Model } = require('objection');
const knexConfig = require('../../knexfile');

const DATE_OID = 1082;
const NUMERIC_OID = 1700;
types.setTypeParser(DATE_OID, (value) => value);
types.setTypeParser(NUMERIC_OID, parseFloat);

const db = knex(knexConfig.development);

Model.knex(db);

module.exports = db;
