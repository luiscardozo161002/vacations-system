require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  server: {
    host: process.env.HOST || '0.0.0.0',
    port: Number(process.env.PORT) || 3000,
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me-in-production',
    accessTokenTtlSeconds: 15 * 60,
    refreshTokenTtlDays: 7,
    passwordResetTtlHours: 1,
    maxFailedLoginAttempts: 5,
    lockMinutes: 15,
  },
};

module.exports = config;
