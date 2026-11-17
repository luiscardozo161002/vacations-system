require('dotenv').config();

const Environment = require('./environment');

class Config {
  constructor(environment) {
    this.env = environment.text('NODE_ENV');

    this.server = {
      host: environment.text('HOST'),
      port: environment.integer('PORT'),
    };

    this.db = {
      host: environment.text('DB_HOST'),
      port: environment.integer('DB_PORT'),
      database: environment.text('DB_NAME'),
      user: environment.text('DB_USER'),
      password: environment.text('DB_PASSWORD'),
    };

    this.auth = {
      jwtSecret: environment.text('JWT_SECRET'),
      accessTokenTtlSeconds: environment.integer('ACCESS_TOKEN_TTL_MINUTES') * 60,
      refreshTokenTtlDays: environment.integer('REFRESH_TOKEN_TTL_DAYS'),
      passwordResetTtlHours: environment.integer('PASSWORD_RESET_TTL_HOURS'),
      maxFailedLoginAttempts: environment.integer('MAX_FAILED_LOGIN_ATTEMPTS'),
      lockMinutes: environment.integer('LOCKOUT_MINUTES'),
      maxFailedLoginsPerIp: environment.integer('MAX_FAILED_LOGINS_PER_IP'),
      failedLoginsWindowMinutes: environment.integer('FAILED_LOGINS_WINDOW_MINUTES'),
    };

    this.proxy = { trusted: environment.list('TRUSTED_PROXIES') };
    this.cors = { origins: environment.list('CORS_ORIGINS') };
  }
}

module.exports = new Config(new Environment());
