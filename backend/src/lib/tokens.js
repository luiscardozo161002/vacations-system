const crypto = require('crypto');
const config = require('../config');

class Tokens {
  generate() {
    return crypto.randomBytes(config.security.tokenBytes).toString('hex');
  }

  hash(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

module.exports = new Tokens();
