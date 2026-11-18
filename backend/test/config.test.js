require('./env');

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const Environment = require('../src/config/environment');
const { Config } = require('../src/config');

const variables = {
  NODE_ENV: 'development',
  HOST: '0.0.0.0',
  PORT: '3000',
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_NAME: 'vacations_test',
  DB_USER: 'postgres',
  DB_PASSWORD: 'postgres',
  JWT_SECRET: 'change-me',
  ACCESS_TOKEN_TTL_MINUTES: '15',
  REFRESH_TOKEN_TTL_DAYS: '7',
  PASSWORD_RESET_TTL_HOURS: '1',
  MAX_FAILED_LOGIN_ATTEMPTS: '5',
  LOCKOUT_MINUTES: '15',
  MAX_FAILED_LOGINS_PER_IP: '20',
  FAILED_LOGINS_WINDOW_MINUTES: '15',
  CORS_ORIGINS: 'http://localhost:5173, http://localhost:5174',
  TRUSTED_PROXIES: '',
};

const configFor = (overrides) => new Config(new Environment({ ...variables, ...overrides }));

describe('Config', () => {
  it('converts the values to numbers and lists', () => {
    const config = configFor({});

    assert.equal(config.server.port, 3000);
    assert.equal(config.auth.accessTokenTtlSeconds, 900);
    assert.deepEqual(config.cors.origins, ['http://localhost:5173', 'http://localhost:5174']);
    assert.deepEqual(config.proxy.trusted, []);
  });

  it('fails when a variable is missing or is not a whole number', () => {
    const { PORT, ...withoutPort } = variables;

    assert.throws(() => new Config(new Environment(withoutPort)), /Missing environment variable PORT/);
    assert.throws(() => configFor({ PORT: '15m' }), /PORT must be a whole number/);
  });

  it('rejects a short JWT secret in production only', () => {
    assert.throws(() => configFor({ NODE_ENV: 'production' }), /JWT_SECRET must have at least 32 characters/);
    assert.doesNotThrow(() => configFor({ NODE_ENV: 'production', JWT_SECRET: 'a'.repeat(32) }));
    assert.doesNotThrow(() => configFor({ NODE_ENV: 'development' }));
  });
});
