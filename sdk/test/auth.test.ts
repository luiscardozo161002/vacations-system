import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { VacationsSdk } from '../src';
import { memoryStorage } from '../src/core/token-storage';
import { json, mockFetch } from './mock-fetch';

const baseUrl = 'http://api.test';

let restore: () => void = () => undefined;

afterEach(() => restore());

const setup = (handler: Parameters<typeof mockFetch>[0]) => {
  const mock = mockFetch(handler);
  restore = mock.restore;
  const storage = memoryStorage();
  return { sdk: new VacationsSdk({ baseUrl, storage }), storage, calls: mock.calls };
};

describe('sdk.auth', () => {
  it('login guarda los tokens y marca la sesión como iniciada', async () => {
    const { sdk, storage, calls } = setup(() =>
      json(200, { accessToken: 'a1', refreshToken: 'r1', expiresIn: 900, user: { user_id: 1 } }),
    );

    await sdk.auth.login({ email: 'ana@empresa.com', password: 'secreta' });

    assert.equal(calls[0].url, `${baseUrl}/api/v1/auth/login`);
    assert.deepEqual(calls[0].body, { email: 'ana@empresa.com', password: 'secreta' });
    assert.deepEqual(storage.get(), { accessToken: 'a1', refreshToken: 'r1' });
    assert.equal(sdk.auth.isAuthenticated(), true);
  });

  it('un login fallido no guarda nada', async () => {
    const { sdk, storage } = setup(() => json(401, { error: { code: 'INVALID_CREDENTIALS' } }));

    await assert.rejects(sdk.auth.login({ username: 'ana', password: 'mala' }));

    assert.equal(storage.get(), null);
  });

  it('logout borra la sesión y revoca el refresh token', async () => {
    const { sdk, storage, calls } = setup(() => new Response(null, { status: 204 }));
    storage.set({ accessToken: 'a1', refreshToken: 'r1' });

    await sdk.auth.logout();

    assert.equal(storage.get(), null);
    assert.equal(calls[0].url, `${baseUrl}/api/v1/auth/logout`);
    assert.deepEqual(calls[0].body, { refreshToken: 'r1' });
  });

  it('logout sin sesión no llama a la API', async () => {
    const { sdk, calls } = setup(() => json(204));

    await sdk.auth.logout();

    assert.equal(calls.length, 0);
  });

  it('changePassword guarda los tokens nuevos', async () => {
    const { sdk, storage } = setup(() => json(200, { accessToken: 'a2', refreshToken: 'r2', expiresIn: 900 }));
    storage.set({ accessToken: 'a1', refreshToken: 'r1' });

    await sdk.auth.changePassword({ currentPassword: 'vieja', newPassword: 'NuevaClave1' });

    assert.deepEqual(storage.get(), { accessToken: 'a2', refreshToken: 'r2' });
  });

  it('refresh sin sesión responde false sin llamar a la API', async () => {
    const { sdk, calls } = setup(() => json(200, {}));

    assert.equal(await sdk.auth.refresh(), false);
    assert.equal(calls.length, 0);
  });
});
