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
  IPV4_MAPPED: GenericValidation.text('::ffff:'),

  SECRET_FIELDS: GenericValidation.list(['password', 'currentPassword', 'newPassword']),
  MAX_USER_AGENT_LENGTH: GenericValidation.positive(255),
  MAX_REQUEST_ID_LENGTH: GenericValidation.positive(64),
  EPSILON: GenericValidation.decimal(0.000001),

  ROLE_GLOBAL: GenericValidation.text('SUPERUSER'),
  ROLE_SCOPED: GenericValidation.text('USER'),

  PASSWORD_SALT_ROUNDS: GenericValidation.positive(10),
  TOKEN_BYTES: GenericValidation.positive(32),
  TEMP_PASSWORD_ALPHABET: GenericValidation.text('ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789').min(2),
  TEMP_PASSWORD_LENGTH: GenericValidation.positive(10),
  TEMP_PASSWORD_VALID_MONTHS: GenericValidation.positive(1),

  DEFAULT_DAILY_HOURS: GenericValidation.decimal(8),
  REMINDER_DAYS: GenericValidation.positive(7),
  ROLLOVER_INTERVAL_HOURS: GenericValidation.positive(24).max(500),
  FIRST_TRANSFER_YEAR: GenericValidation.positive(2024),
  TRANSFER_EVERY_YEARS: GenericValidation.positive(6),

  PAGE_SIZE_DEFAULT: GenericValidation.positive(20),
  PAGE_SIZE_MAX: GenericValidation.positive(100),
  PASSWORD_MIN_LENGTH: GenericValidation.positive(8),
  PASSWORD_MAX_LENGTH: GenericValidation.positive(100),
  CALENDAR_MAX_RANGE_DAYS: GenericValidation.positive(62),
  DASHBOARD_UPCOMING_DAYS: GenericValidation.positive(30),
  DASHBOARD_LIST_LIMIT: GenericValidation.positive(4),
  DASHBOARD_MY_LIST_LIMIT: GenericValidation.positive(5),
  NOTIFICATIONS_LIST_LIMIT: GenericValidation.positive(20),
  NOTIFICATIONS_PENDING_LIMIT: GenericValidation.positive(10),

  TIME_ZONE: GenericValidation.timeZone('America/Mexico_City'),
  PDF_DEFAULT_PHONE: GenericValidation.text('TEL. 01-773-78-50497 / 504-98 / 500-09      FAX 506-22'),
  PDF_MANAGER_NAME: GenericValidation.text('RECURSOS HUMANOS'),
  PDF_LOGO_TIMEOUT_MS: GenericValidation.positive(3000),

  CSV_INCLUDE_BOM: GenericValidation.flag(true),
  INVALID_JSON_MESSAGE: GenericValidation.text('Invalid request payload JSON format'),
});

const { error, value: vars } = schema.validate(process.env, { abortEarly: false, allowUnknown: true });

if (error) {
  throw new Error(`Invalid environment variables: ${error.message}`);
}

const HOUR_MS = 60 * 60 * 1000;

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
  proxy: { trusted: vars.TRUSTED_PROXIES, ipv4Mapped: vars.IPV4_MAPPED },
  cors: { origins: vars.CORS_ORIGINS },
  audit: {
    secretFields: vars.SECRET_FIELDS,
    maxUserAgentLength: vars.MAX_USER_AGENT_LENGTH,
    maxRequestIdLength: vars.MAX_REQUEST_ID_LENGTH,
  },
  balance: { epsilon: vars.EPSILON },
  roles: {
    global: vars.ROLE_GLOBAL,
    scoped: vars.ROLE_SCOPED,
  },
  security: {
    saltRounds: vars.PASSWORD_SALT_ROUNDS,
    tokenBytes: vars.TOKEN_BYTES,
  },
  temporaryPassword: {
    alphabet: vars.TEMP_PASSWORD_ALPHABET,
    length: vars.TEMP_PASSWORD_LENGTH,
    validMonths: vars.TEMP_PASSWORD_VALID_MONTHS,
  },
  work: {
    defaultDailyHours: vars.DEFAULT_DAILY_HOURS,
    reminderDays: vars.REMINDER_DAYS,
  },
  rollover: { intervalMs: vars.ROLLOVER_INTERVAL_HOURS * HOUR_MS },
  holidays: {
    firstTransferYear: vars.FIRST_TRANSFER_YEAR,
    transferEveryYears: vars.TRANSFER_EVERY_YEARS,
  },
  pagination: {
    defaultPageSize: vars.PAGE_SIZE_DEFAULT,
    maxPageSize: vars.PAGE_SIZE_MAX,
  },
  passwordPolicy: {
    minLength: vars.PASSWORD_MIN_LENGTH,
    maxLength: vars.PASSWORD_MAX_LENGTH,
  },
  calendar: { maxRangeDays: vars.CALENDAR_MAX_RANGE_DAYS },
  dashboard: {
    upcomingDays: vars.DASHBOARD_UPCOMING_DAYS,
    listLimit: vars.DASHBOARD_LIST_LIMIT,
    myListLimit: vars.DASHBOARD_MY_LIST_LIMIT,
  },
  notifications: {
    listLimit: vars.NOTIFICATIONS_LIST_LIMIT,
    pendingLimit: vars.NOTIFICATIONS_PENDING_LIMIT,
  },
  timeZone: vars.TIME_ZONE,
  pdf: {
    defaultPhone: vars.PDF_DEFAULT_PHONE,
    managerName: vars.PDF_MANAGER_NAME,
    logoTimeoutMs: vars.PDF_LOGO_TIMEOUT_MS,
  },
  csv: { bom: vars.CSV_INCLUDE_BOM ? '﻿' : '' },
  errors: { invalidJsonMessage: vars.INVALID_JSON_MESSAGE },
  time: { dayMs: 24 * HOUR_MS },
};
