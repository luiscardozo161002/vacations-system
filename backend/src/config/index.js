const Joi = require('joi');
require('dotenv').config();

const GenericValidation = require('../lib/generic-validators');

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
  ACCESS_TOKEN_TTL_MINUTES: GenericValidation.positive(15),
  REFRESH_TOKEN_TTL_DAYS: GenericValidation.positive(7),
  PASSWORD_RESET_TTL_HOURS: GenericValidation.positive(1),
  MAX_FAILED_LOGIN_ATTEMPTS: GenericValidation.positive(5),
  LOCKOUT_MINUTES: GenericValidation.positive(15),
  MAX_FAILED_LOGINS_PER_IP: GenericValidation.positive(20),
  FAILED_LOGINS_WINDOW_MINUTES: GenericValidation.positive(15),

  CORS_ORIGINS: GenericValidation.list(['http://localhost:5173']),
  TRUSTED_PROXIES: GenericValidation.list(),

  SECRET_FIELDS: GenericValidation.list(['password', 'currentPassword', 'newPassword']),
  MAX_USER_AGENT_LENGTH: GenericValidation.positive(255),
  MAX_REQUEST_ID_LENGTH: GenericValidation.positive(64),
  EPSILON: GenericValidation.decimal(0.000001),
});

const { error, value: vars } = schema.validate(process.env, { abortEarly: false, allowUnknown: true });

if (error) {
  throw new Error(`Invalid environment variables: ${error.message}`);
}

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
  proxy: { trusted: vars.TRUSTED_PROXIES },
  cors: { origins: vars.CORS_ORIGINS },
  audit: {
    secretFields: vars.SECRET_FIELDS,
    maxUserAgentLength: vars.MAX_USER_AGENT_LENGTH,
    maxRequestIdLength: vars.MAX_REQUEST_ID_LENGTH,
  },
  balance: { epsilon: vars.EPSILON },
};
