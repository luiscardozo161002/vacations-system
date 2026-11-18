const crypto = require('crypto');
const password = require('./password');
const config = require('../config');

const { alphabet, length, validMonths } = config.temporaryPassword;

class TemporaryPassword {
  generate() {
    return Array.from(crypto.randomBytes(length), (byte) => alphabet[byte % alphabet.length]).join('');
  }

  expiresAt(from = new Date()) {
    const date = new Date(from);
    date.setMonth(date.getMonth() + validMonths);
    return date.toISOString();
  }

  async issue() {
    const plain = this.generate();
    return {
      plain,
      fields: {
        password_hash: await password.hash(plain),
        must_change_password: true,
        temporary_password_expires_at: this.expiresAt(),
      },
    };
  }

  isExpired(user, now = new Date()) {
    const expiresAt = user.temporary_password_expires_at;
    return Boolean(user.must_change_password && expiresAt && new Date(expiresAt) < now);
  }
}

module.exports = new TemporaryPassword();
