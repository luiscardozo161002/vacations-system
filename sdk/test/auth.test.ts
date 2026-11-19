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
  let expired = 0;
  const sdk = new VacationsSdk({ baseUrl, storage, onSessionExpired: () => { expired += 1; } });
  return { sdk, storage, calls: mock.calls, expiredCount: () => expired };
};

const deferredResponse = () => {
  let resolve!: (response: Response) => void;
  const response = new Promise<Response>((finish) => { resolve = finish; });
  return { response, resolve };
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

  it('una renovación pendiente conserva el logout aunque termine correctamente', async () => {
    const pending = deferredResponse();
    const { sdk, storage, expiredCount } = setup((call) =>
      call.url.endsWith('/auth/refresh') ? pending.response : new Response(null, { status: 204 }),
    );
    storage.set({ accessToken: 'a1', refreshToken: 'r1' });

    const refresh = sdk.auth.refresh();
    await sdk.auth.logout();
    pending.resolve(json(200, { accessToken: 'a2', refreshToken: 'r2' }));

    assert.equal(await refresh, false);
    assert.equal(storage.get(), null);
    assert.equal(expiredCount(), 0);
  });

  for (const status of [200, 401, 403, 500]) {
    it(`una renovación anterior con estado ${status} conserva el login posterior`, async () => {
      const pending = deferredResponse();
      const newTokens = { accessToken: 'new-account', refreshToken: 'new-refresh' };
      const { sdk, storage, expiredCount } = setup((call) =>
        call.url.endsWith('/auth/refresh') ? pending.response : json(200, newTokens),
      );
      storage.set({ accessToken: 'old-account', refreshToken: 'old-refresh' });

      const refresh = sdk.auth.refresh();
      await sdk.auth.login({ username: 'new-account', password: 'test-only' });
      pending.resolve(json(status, status === 200
        ? { accessToken: 'old-renewed', refreshToken: 'old-rotated' }
        : { error: { code: 'REFRESH_FAILED' } }));

      assert.equal(await refresh, false);
      assert.deepEqual(storage.get(), newTokens);
      assert.equal(expiredCount(), 0);
    });
  }

  it('la sesión nueva puede renovar mientras finaliza la anterior y comparte su propia petición', async () => {
    const oldPending = deferredResponse();
    const newPending = deferredResponse();
    const newTokens = { accessToken: 'new-account', refreshToken: 'new-refresh' };
    const { sdk, storage, calls } = setup((call) => {
      if (!call.url.endsWith('/auth/refresh')) return json(200, newTokens);
      const body = call.body as { refreshToken: string };
      return body.refreshToken === 'old-refresh' ? oldPending.response : newPending.response;
    });
    storage.set({ accessToken: 'old-account', refreshToken: 'old-refresh' });

    const oldRefresh = sdk.auth.refresh();
    await sdk.auth.login({ username: 'new-account', password: 'test-only' });
    const newRefresh = sdk.auth.refresh();
    assert.equal(sdk.auth.refresh(), newRefresh);
    assert.equal(calls.filter((call) => call.url.endsWith('/auth/refresh')).length, 2);

    oldPending.resolve(json(401, { error: { code: 'INVALID_REFRESH_TOKEN' } }));
    assert.equal(await oldRefresh, false);
    assert.equal(sdk.auth.refresh(), newRefresh);

    const renewed = { accessToken: 'new-renewed', refreshToken: 'new-rotated' };
    newPending.resolve(json(200, renewed));
    assert.equal(await newRefresh, true);
    assert.deepEqual(storage.get(), renewed);
  });
});
