require('dotenv').config();

const env = process.env.NODE_ENV;

const config = {
  env,
  server: {
    host: process.env.HOST,
    port: process.env.PORT,
  },
  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    accessTokenTtlSeconds: process.env.ACCESS_TOKEN_TTL_MINUTES,
    refreshTokenTtlDays: process.env.REFRESH_TOKEN_TTL_DAYS,
    passwordResetTtlHours: process.env.PASSWORD_RESET_TTL_HOURS,
    maxFailedLoginAttempts: process.env.MAX_FAILED_LOGIN_ATTEMPTS,
    lockMinutes: process.env.LOCKOUT_MINUTES,
    maxFailedLoginsPerIp: process.env.MAX_FAILED_LOGINS_PER_IP,
    failedLoginsWindowMinutes: process.env.FAILED_LOGINS_WINDOW_MINUTES,
  },
  proxy: {
    trusted: (process.env.TRUSTED_PROXIES)
      .split(',')
      .map((ip) => ip.trim())
      .filter(Boolean),
  },
  cors: {
    origins: (process.env.CORS_ORIGINS).split(',').map((origin) => origin.trim()),
  },
};

module.exports = config;
