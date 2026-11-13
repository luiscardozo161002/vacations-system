'use strict';

const crypto = require('crypto');
const password = require('./password');

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
const LENGTH = 10;
const VALID_MONTHS = 1;

const generate = () => Array.from(crypto.randomBytes(LENGTH), (byte) => ALPHABET[byte % ALPHABET.length]).join('');

const expiresAt = (from = new Date()) => {
  const date = new Date(from);
  date.setMonth(date.getMonth() + VALID_MONTHS);
  return date.toISOString();
};

const issueTemporaryPassword = async () => {
  const plain = generate();
  return {
    plain,
    fields: {
      password_hash: await password.hash(plain),
      must_change_password: true,
      temporary_password_expires_at: expiresAt(),
    },
  };
};

const isExpired = (user, now = new Date()) =>
  Boolean(user.must_change_password && user.temporary_password_expires_at && new Date(user.temporary_password_expires_at) < now);

module.exports = { issueTemporaryPassword, isExpired, expiresAt };
