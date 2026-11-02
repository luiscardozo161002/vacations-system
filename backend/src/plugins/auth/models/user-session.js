'use strict';

const { Model } = require('objection');

// Modelo interno del plugin auth: no tiene plugin/rutas propias (ver README, seccion de
// autenticacion) porque las sesiones las crea y revoca unicamente el flujo de login/refresh/logout.
class UserSession extends Model {
  static get tableName() {
    return 'user_sessions';
  }

  static get idColumn() {
    return 'session_id';
  }
}

module.exports = UserSession;
