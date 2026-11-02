'use strict';

const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

const hash = (plain) => bcrypt.hash(plain, SALT_ROUNDS);
const verify = (plain, hashed) => bcrypt.compare(plain, hashed);

module.exports = { hash, verify };
