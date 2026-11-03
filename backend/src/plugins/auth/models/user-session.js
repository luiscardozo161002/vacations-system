'use strict';

const { Model } = require('objection');

class UserSession extends Model {
  static get tableName() {
    return 'user_sessions';
  }

  static get idColumn() {
    return 'session_id';
  }
}

module.exports = UserSession;
