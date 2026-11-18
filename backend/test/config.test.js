const { describe, it, mock } = require('node:test');
const assert = require('node:assert/strict');
const dotenv = require('dotenv');

const configPath = require.resolve('../src/config');

const configFor = (overrides = {}) => {
  const originalEnv = process.env;
  const loadDotenv = mock.method(dotenv, 'config', () => ({}));
  process.env = { DB_NAME: 'vacations_test', DB_USER: 'postgres', JWT_SECRET: 'change-me', ...overrides };

  try {
    return require(configPath);
  } finally {
    delete require.cache[configPath];
    process.env = originalEnv;
    loadDotenv.mock.restore();
  }
};

describe('Config', () => {
  it('uses development defaults when optional variables are missing', () => {
    const config = configFor();

    assert.equal(config.env, 'development');
    assert.equal(config.server.port, 3000);
    assert.equal(config.auth.accessTokenTtlSeconds, 900);
    assert.equal(config.auth.maxFailedLoginsPerIp, 20);
    assert.deepEqual(config.cors.origins, ['http://localhost:5173']);
    assert.deepEqual(config.proxy.trusted, []);
  });

  it('converts the values to numbers and lists', () => {
    const config = configFor({
      PORT: '3001',
      ACCESS_TOKEN_TTL_MINUTES: '2',
      CORS_ORIGINS: 'http://localhost:5173, http://localhost:5174',
      TRUSTED_PROXIES: ' 127.0.0.2, ,',
    });

    assert.equal(config.server.port, 3001);
    assert.equal(config.auth.accessTokenTtlSeconds, 120);
    assert.deepEqual(config.cors.origins, ['http://localhost:5173', 'http://localhost:5174']);
    assert.deepEqual(config.proxy.trusted, ['127.0.0.2']);
  });

  it('defaults the audit and balance settings and never trusts a proxy', () => {
    const config = configFor();

    assert.deepEqual(config.audit.secretFields, ['password', 'currentPassword', 'newPassword']);
    assert.equal(config.audit.maxUserAgentLength, 255);
    assert.equal(config.audit.maxRequestIdLength, 64);
    assert.equal(config.balance.epsilon, 0.000001);
    assert.deepEqual(config.proxy.trusted, []);
    assert.equal(config.proxy.ipv4Mapped, '::ffff:');
  });

  it('reads the audit and balance settings from the environment', () => {
    const config = configFor({
      SECRET_FIELDS: 'token, pin',
      MAX_USER_AGENT_LENGTH: '100',
      MAX_REQUEST_ID_LENGTH: '32',
      EPSILON: '0.001',
      TRUSTED_PROXIES: '',
    });

    assert.deepEqual(config.audit.secretFields, ['token', 'pin']);
    assert.equal(config.audit.maxUserAgentLength, 100);
    assert.equal(config.audit.maxRequestIdLength, 32);
    assert.equal(config.balance.epsilon, 0.001);
    assert.deepEqual(config.proxy.trusted, []);
  });

  it('defaults the roles, security, work and holiday settings', () => {
    const config = configFor();

    assert.deepEqual(config.roles, { global: 'SUPERUSER', scoped: 'USER' });
    assert.deepEqual(config.security, { saltRounds: 10, tokenBytes: 32 });
    assert.equal(config.temporaryPassword.length, 10);
    assert.equal(config.temporaryPassword.validMonths, 1);
    assert.deepEqual(config.work, { defaultDailyHours: 8, reminderDays: 7 });
    assert.deepEqual(config.holidays, { firstTransferYear: 2024, transferEveryYears: 6 });
    assert.equal(config.rollover.intervalMs, 24 * 60 * 60 * 1000);
    assert.equal(config.time.dayMs, 24 * 60 * 60 * 1000);
    assert.equal(config.csv.bom, '﻿');
    assert.equal(config.errors.invalidJsonMessage, 'Invalid request payload JSON format');
  });

  it('reads the roles, security, work and holiday settings from the environment', () => {
    const config = configFor({
      ROLE_GLOBAL: 'ROOT',
      PASSWORD_SALT_ROUNDS: '4',
      TEMP_PASSWORD_ALPHABET: 'ab12',
      DEFAULT_DAILY_HOURS: '7.5',
      ROLLOVER_INTERVAL_HOURS: '12',
      CSV_INCLUDE_BOM: 'false',
    });

    assert.equal(config.roles.global, 'ROOT');
    assert.equal(config.security.saltRounds, 4);
    assert.equal(config.temporaryPassword.alphabet, 'ab12');
    assert.equal(config.work.defaultDailyHours, 7.5);
    assert.equal(config.rollover.intervalMs, 12 * 60 * 60 * 1000);
    assert.equal(config.csv.bom, '');
  });

  it('rejects an invalid roles, security or work setting', () => {
    assert.throws(() => configFor({ PASSWORD_SALT_ROUNDS: '0' }), /PASSWORD_SALT_ROUNDS/);
    assert.throws(() => configFor({ TEMP_PASSWORD_ALPHABET: 'a' }), /TEMP_PASSWORD_ALPHABET/);
    assert.throws(() => configFor({ ROLLOVER_INTERVAL_HOURS: '1000' }), /ROLLOVER_INTERVAL_HOURS/);
    assert.throws(() => configFor({ CSV_INCLUDE_BOM: 'maybe' }), /CSV_INCLUDE_BOM/);
  });

  it('names every invalid variable without exposing its value', () => {
    assert.throws(
      () => configFor({ PORT: '15m', DB_PORT: '70000', MAX_FAILED_LOGINS_PER_IP: '0', NODE_ENV: 'staging' }),
      (error) => {
        assert.match(error.message, /PORT/);
        assert.match(error.message, /DB_PORT/);
        assert.match(error.message, /MAX_FAILED_LOGINS_PER_IP/);
        assert.match(error.message, /NODE_ENV/);
        assert.doesNotMatch(error.message, /15m|70000|staging/);
        return true;
      },
    );
  });

  it('requires the database and JWT settings', () => {
    assert.throws(() => configFor({ DB_NAME: undefined }), /DB_NAME/);
    assert.throws(() => configFor({ DB_USER: '' }), /DB_USER/);
    assert.throws(() => configFor({ JWT_SECRET: undefined }), /JWT_SECRET/);
  });

  it('requires a long JWT secret in production', () => {
    assert.throws(
      () => configFor({ NODE_ENV: 'production', JWT_SECRET: 'secreto-demasiado-corto' }),
      (error) => /JWT_SECRET/.test(error.message) && !/secreto-demasiado-corto/.test(error.message),
    );
    assert.throws(() => configFor({ NODE_ENV: 'production', JWT_SECRET: ' '.repeat(32) }), /JWT_SECRET/);
    assert.doesNotThrow(() => configFor({ NODE_ENV: 'production', JWT_SECRET: 'a'.repeat(32) }));
    assert.doesNotThrow(() => configFor({ NODE_ENV: 'development', JWT_SECRET: 'change-me' }));
  });
});
