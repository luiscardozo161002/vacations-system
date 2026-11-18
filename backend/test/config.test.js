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

  it('uses defaults for invalid numeric overrides', () => {
    const config = configFor({ PORT: '15m', DB_PORT: '70000', MAX_FAILED_LOGINS_PER_IP: '0' });

    assert.equal(config.server.port, 3000);
    assert.equal(config.db.port, 5432);
    assert.equal(config.auth.maxFailedLoginsPerIp, 20);
  });

  it('keeps a valid CORS origin when the configured list is empty', () => {
    const config = configFor({ CORS_ORIGINS: ' , ' });

    assert.deepEqual(config.cors.origins, ['http://localhost:5173']);
  });

  it('reports invalid required settings with a generic message', () => {
    let message;
    const genericError = (error) => {
      message ??= error.message;
      assert.equal(error.message, message);
      assert.ok(error.message.trim());
      assert.doesNotMatch(error.message, /DB_NAME|DB_USER|JWT_SECRET|vacations_test|postgres|change-me|secreto-demasiado-corto/i);
      return true;
    };

    assert.throws(() => configFor({ DB_NAME: undefined }), genericError);
    assert.throws(() => configFor({ DB_USER: '' }), genericError);
    assert.throws(() => configFor({ JWT_SECRET: undefined }), genericError);
    assert.throws(() => configFor({ NODE_ENV: 'production', JWT_SECRET: 'secreto-demasiado-corto' }), genericError);
    assert.throws(() => configFor({ NODE_ENV: 'production', JWT_SECRET: ' '.repeat(32) }), genericError);
    assert.doesNotThrow(() => configFor({ NODE_ENV: 'production', JWT_SECRET: 'a'.repeat(32) }));
    assert.doesNotThrow(() => configFor({ NODE_ENV: 'development', JWT_SECRET: 'change-me' }));
  });
});
