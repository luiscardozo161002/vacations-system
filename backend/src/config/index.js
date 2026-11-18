require('dotenv').config();

const vars = process.env;
const env = vars.NODE_ENV || 'development';
const { DB_NAME: database, DB_USER: user, JWT_SECRET: jwtSecret } = vars;
const minSecretLength = env === 'production' ? 32 : 1;

if (!database?.trim() || !user?.trim() || (jwtSecret?.trim().length ?? 0) < minSecretLength) {
  throw new Error('Error to load configuration.');
}

const integer = (value, fallback, max = Number.MAX_SAFE_INTEGER) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 && number <= max ? number : fallback;
};

const list = (value = '') => value.split(',').map((item) => item.trim()).filter(Boolean);
const corsOrigins = list(vars.CORS_ORIGINS);

module.exports = {
  env,
  server: {
    host: vars.HOST || '0.0.0.0',
    port: integer(vars.PORT, 3000, 65535),
  },
  db: {
    host: vars.DB_HOST || 'localhost',
    port: integer(vars.DB_PORT, 5432, 65535),
    database,
    user,
    password: vars.DB_PASSWORD,
  },
  auth: {
    jwtSecret,
    accessTokenTtlSeconds: integer(vars.ACCESS_TOKEN_TTL_MINUTES, 15) * 60,
    refreshTokenTtlDays: integer(vars.REFRESH_TOKEN_TTL_DAYS, 7),
    passwordResetTtlHours: integer(vars.PASSWORD_RESET_TTL_HOURS, 1),
    maxFailedLoginAttempts: integer(vars.MAX_FAILED_LOGIN_ATTEMPTS, 5),
    lockMinutes: integer(vars.LOCKOUT_MINUTES, 15),
    maxFailedLoginsPerIp: integer(vars.MAX_FAILED_LOGINS_PER_IP, 20),
    failedLoginsWindowMinutes: integer(vars.FAILED_LOGINS_WINDOW_MINUTES, 15),
  },
  proxy: { trusted: list(vars.TRUSTED_PROXIES) },
  cors: { origins: corsOrigins.length ? corsOrigins : ['http://localhost:5173'] },
};
