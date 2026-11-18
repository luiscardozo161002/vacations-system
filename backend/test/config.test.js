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
    assert.throws(() => configFor({ CORS_ORIGINS: '' }), /CORS_ORIGINS/);
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
