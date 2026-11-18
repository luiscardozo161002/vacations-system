const bcrypt = require('bcryptjs');
const config = require('../config');

class PasswordHasher {
  hash(plain) {
    return bcrypt.hash(plain, config.security.saltRounds);
  }

  verify(plain, hashed) {
    return bcrypt.compare(plain, hashed);
  }
}

module.exports = new PasswordHasher();
