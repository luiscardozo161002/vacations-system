const Joi = require('joi');
require('dotenv').config();

const positiveInteger = (fallback) => Joi.number().integer().positive().default(fallback);

const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  HOST: Joi.string().default('0.0.0.0'),
  PORT: Joi.number().port().default(3000),

  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().port().default(5432),
  DB_NAME: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow(''),

  JWT_SECRET: Joi.string().trim().required().when('NODE_ENV', { is: 'production', then: Joi.string().min(32) }),
  ACCESS_TOKEN_TTL_MINUTES: positiveInteger(15),
  REFRESH_TOKEN_TTL_DAYS: positiveInteger(7),
  PASSWORD_RESET_TTL_HOURS: positiveInteger(1),
  MAX_FAILED_LOGIN_ATTEMPTS: positiveInteger(5),
  LOCKOUT_MINUTES: positiveInteger(15),
  MAX_FAILED_LOGINS_PER_IP: positiveInteger(20),
  FAILED_LOGINS_WINDOW_MINUTES: positiveInteger(15),

  CORS_ORIGINS: Joi.string().default('http://localhost:5173'),
  TRUSTED_PROXIES: Joi.string().allow('').default(''),
});

const { error, value: vars } = schema.validate(process.env, { abortEarly: false, allowUnknown: true });

if (error) {
  throw new Error(`Invalid environment variables: ${error.message}`);
}

const list = (value) => value.split(',').map((item) => item.trim()).filter(Boolean);

module.exports = {
  env: vars.NODE_ENV,
  server: {
    host: vars.HOST,
    port: vars.PORT,
  },
  db: {
    host: vars.DB_HOST,
    port: vars.DB_PORT,
    database: vars.DB_NAME,
    user: vars.DB_USER,
    password: vars.DB_PASSWORD,
  },
  auth: {
    jwtSecret: vars.JWT_SECRET,
    accessTokenTtlSeconds: vars.ACCESS_TOKEN_TTL_MINUTES * 60,
    refreshTokenTtlDays: vars.REFRESH_TOKEN_TTL_DAYS,
    passwordResetTtlHours: vars.PASSWORD_RESET_TTL_HOURS,
    maxFailedLoginAttempts: vars.MAX_FAILED_LOGIN_ATTEMPTS,
    lockMinutes: vars.LOCKOUT_MINUTES,
    maxFailedLoginsPerIp: vars.MAX_FAILED_LOGINS_PER_IP,
    failedLoginsWindowMinutes: vars.FAILED_LOGINS_WINDOW_MINUTES,
  },
  proxy: { trusted: list(vars.TRUSTED_PROXIES) },
  cors: { origins: list(vars.CORS_ORIGINS) },
};
