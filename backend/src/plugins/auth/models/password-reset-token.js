'use strict';

const { Model } = require('objection');

// Modelo interno del plugin auth: solo lo escriben/leen los flujos de password-reset.
class PasswordResetToken extends Model {
  static get tableName() {
    return 'password_reset_tokens';
  }

  static get idColumn() {
    return 'token_id';
  }
}

module.exports = PasswordResetToken;
