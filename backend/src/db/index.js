const knex = require('knex');
const { Model } = require('objection');
const knexConfig = require('../../knexfile');

const db = knex(knexConfig.development);

// Objection necesita una sola instancia de knex "bindeada" globalmente;
// todos los modelos (Employee, etc.) la toman de aca.
Model.knex(db);

module.exports = db;
