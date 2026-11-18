require('dotenv').config();

const vars = process.env;
const env = vars.NODE_ENV || 'development';

const list = (value = '') => value.split(',').map((item) => item.trim()).filter(Boolean);

module.exports = {
  env,
  server: {
    host: vars.HOST || '0.0.0.0',
    port: Number(vars.PORT) || 3000,
  },
  db: {
    host: vars.DB_HOST || 'localhost',
    port: Number(vars.DB_PORT) || 5432,
    database: vars.DB_NAME,
    user: vars.DB_USER,
    password: vars.DB_PASSWORD,
  },
  auth: {
    jwtSecret: vars.JWT_SECRET,
    accessTokenTtlSeconds: Number(vars.ACCESS_TOKEN_TTL_MINUTES) * 60 || 900,
    refreshTokenTtlDays: Number(vars.REFRESH_TOKEN_TTL_DAYS) || 7,
    passwordResetTtlHours: Number(vars.PASSWORD_RESET_TTL_HOURS) || 1,
    maxFailedLoginAttempts: Number(vars.MAX_FAILED_LOGIN_ATTEMPTS) || 5,
    lockMinutes: Number(vars.LOCKOUT_MINUTES) || 15,
    maxFailedLoginsPerIp: Number(vars.MAX_FAILED_LOGINS_PER_IP) || 20,
    failedLoginsWindowMinutes: Number(vars.FAILED_LOGINS_WINDOW_MINUTES) || 15,
  },
  proxy: { trusted: list(vars.TRUSTED_PROXIES) },
  cors: { origins: list(vars.CORS_ORIGINS) },
};
