const crypto = require('crypto');
const password = require('./password');

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
const LENGTH = 10;
const VALID_MONTHS = 1;

class TemporaryPassword {
  generate() {
    return Array.from(crypto.randomBytes(LENGTH), (byte) => ALPHABET[byte % ALPHABET.length]).join('');
  }

  expiresAt(from = new Date()) {
    const date = new Date(from);
    date.setMonth(date.getMonth() + VALID_MONTHS);
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
