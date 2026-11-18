const crypto = require('crypto');

class Tokens {
  generate() {
    return crypto.randomBytes(32).toString('hex');
  }

  hash(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

module.exports = new Tokens();
