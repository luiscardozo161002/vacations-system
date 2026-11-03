'use strict';

const { Model } = require('objection');

class PasswordResetToken extends Model {
  static get tableName() {
    return 'password_reset_tokens';
  }

  static get idColumn() {
    return 'token_id';
  }
}

module.exports = PasswordResetToken;
