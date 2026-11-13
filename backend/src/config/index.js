require('dotenv').config();

const env = process.env.NODE_ENV || 'development';
const EXAMPLE_JWT_SECRET = 'dev-secret-change-me-in-production';

if (env === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === EXAMPLE_JWT_SECRET)) {
  throw new Error('JWT_SECRET es obligatorio en produccion y no puede ser el valor de ejemplo');
}

const config = {
  env,
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
    jwtSecret: process.env.JWT_SECRET || EXAMPLE_JWT_SECRET,
    accessTokenTtlSeconds: 15 * 60,
    refreshTokenTtlDays: 7,
    passwordResetTtlHours: 1,
    maxFailedLoginAttempts: 5,
    lockMinutes: 15,
    maxFailedLoginsPerIp: 20,
    failedLoginsWindowMinutes: 15,
  },
  proxy: {
    trusted: (process.env.TRUSTED_PROXIES || '')
      .split(',')
      .map((ip) => ip.trim())
      .filter(Boolean),
  },
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map((origin) => origin.trim()),
  },
};

module.exports = config;
