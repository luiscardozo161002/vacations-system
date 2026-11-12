import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HttpClient } from '../src/core/http-client';
import { SdkHttpError } from '../src/core/api-error';
import { memoryStorage } from '../src/core/token-storage';
import { json, mockFetch } from './mock-fetch';

const baseUrl = 'http://api.test';
const REFRESH_PATH = '/api/v1/auth/refresh';

let restore: () => void = () => undefined;

afterEach(() => restore());

const setup = (handler: Parameters<typeof mockFetch>[0], tokens = { accessToken: 'a1', refreshToken: 'r1' }) => {
  const mock = mockFetch(handler);
  restore = mock.restore;
  const storage = memoryStorage();
  storage.set(tokens);
  let expired = 0;
  const onSessionExpired = () => {
    expired += 1;
  };
  const http = new HttpClient({ baseUrl, storage, onSessionExpired });
  return { http, storage, calls: mock.calls, expiredCount: () => expired };
};

describe('transporte', () => {
  it('arma la URL con el query string y omite los valores vacíos', async () => {
    const { http, calls } = setup(() => json(200, {}));

    await http.request('/api/v1/employees', { query: { page: 2, status: 'active', search: undefined, sort: null } });

    assert.equal(calls[0].url, `${baseUrl}/api/v1/employees?page=2&status=active`);
  });

  it('manda el método, el body en JSON y el token', async () => {
    const { http, calls } = setup(() => json(201, { id: 1 }));

    const result = await http.request<{ id: number }>('/api/v1/employees', { method: 'POST', body: { name: 'Ana' } });

    assert.deepEqual(result, { id: 1 });
    assert.equal(calls[0].method, 'POST');
    assert.deepEqual(calls[0].body, { name: 'Ana' });
    assert.equal(calls[0].headers['Content-Type'], 'application/json');
    assert.equal(calls[0].headers.Authorization, 'Bearer a1');
  });

  it('no manda token en las rutas públicas', async () => {
    const { http, calls } = setup(() => json(200, {}));

    await http.request('/api/v1/auth/login', { method: 'POST', body: {}, auth: false });

    assert.equal(calls[0].headers.Authorization, undefined);
  });

  it('devuelve undefined cuando la respuesta viene vacía', async () => {
    const { http } = setup(() => new Response(null, { status: 204 }));

    assert.equal(await http.request('/api/v1/employees/1', { method: 'DELETE' }), undefined);
  });

  it('falla si una respuesta exitosa no es JSON', async () => {
    const { http } = setup(() => new Response('<html>', { status: 200 }));

    await assert.rejects(http.request('/api/v1/health'), /JSON invalida/);
  });
});

describe('errores', () => {
  it('traduce el cuerpo de error de la API a SdkHttpError', async () => {
    const { http } = setup(() => json(409, { error: { code: 'DUPLICATE', message: 'Ese correo ya esta en uso' } }));

    await assert.rejects(http.request('/api/v1/users', { method: 'POST' }), (err: unknown) => {
      assert.ok(err instanceof SdkHttpError);
      assert.equal(err.status, 409);
      assert.equal(err.code, 'DUPLICATE');
      assert.equal(err.message, 'Ese correo ya esta en uso');
      return true;
    });
  });

  it('usa un código genérico cuando el error no trae cuerpo', async () => {
    const { http } = setup(() => new Response('', { status: 502 }));

    await assert.rejects(http.request('/api/v1/health'), (err: unknown) => {
      assert.ok(err instanceof SdkHttpError);
      assert.equal(err.code, 'UNKNOWN_ERROR');
      assert.match(err.message, /502/);
      return true;
    });
  });
});

describe('archivos', () => {
  it('requestBlob devuelve el archivo tal cual', async () => {
    const { http } = setup(() => new Response('%PDF-1.7', { status: 200, headers: { 'Content-Type': 'application/pdf' } }));

    const blob = await http.requestBlob('/api/v1/notices/1/pdf');

    assert.equal(blob.type, 'application/pdf');
    assert.equal(await blob.text(), '%PDF-1.7');
  });

  it('requestBlob traduce los errores igual que request', async () => {
    const { http } = setup(() => json(409, { error: { code: 'NOTICE_NOT_APPROVED', message: 'Solo hay PDF de avisos aprobados' } }));

    await assert.rejects(http.requestBlob('/api/v1/notices/1/pdf'), (err: unknown) => {
      assert.ok(err instanceof SdkHttpError);
      assert.equal(err.code, 'NOTICE_NOT_APPROVED');
      return true;
    });
  });

  it('requestBlob renueva la sesión en un 401 y reintenta', async () => {
    let attempts = 0;
    const { http } = setup((call) => {
      if (call.url.endsWith(REFRESH_PATH)) return json(200, { accessToken: 'a2', refreshToken: 'r2' });
      attempts += 1;
      return attempts === 1 ? json(401, {}) : new Response('%PDF', { status: 200 });
    });

    assert.equal(await (await http.requestBlob('/api/v1/notices/1/pdf')).text(), '%PDF');
    assert.equal(attempts, 2);
  });
});

describe('renovación de sesión', () => {
  const expiredThenOk = (call: { url: string; headers: Record<string, string> }) => {
    if (call.url.endsWith(REFRESH_PATH)) return json(200, { accessToken: 'a2', refreshToken: 'r2', expiresIn: 900 });
    return call.headers.Authorization === 'Bearer a2' ? json(200, { ok: true }) : json(401, { error: { code: 'UNAUTHORIZED' } });
  };

  it('en un 401 renueva el token y reintenta la petición una vez', async () => {
    const { http, storage, calls } = setup(expiredThenOk);

    const result = await http.request<{ ok: boolean }>('/api/v1/employees');

    assert.deepEqual(result, { ok: true });
    assert.deepEqual(
      calls.map((call) => call.url.replace(baseUrl, '')),
      ['/api/v1/employees', REFRESH_PATH, '/api/v1/employees'],
    );
    assert.deepEqual(calls[1].body, { refreshToken: 'r1' });
    assert.deepEqual(storage.get(), { accessToken: 'a2', refreshToken: 'r2' });
  });

  it('varias peticiones con 401 al mismo tiempo comparten un solo refresh', async () => {
    const { http, calls } = setup(expiredThenOk);

    const results = await Promise.all([
      http.request('/api/v1/employees'),
      http.request('/api/v1/departments'),
      http.request('/api/v1/shifts'),
    ]);

    assert.equal(results.length, 3);
    assert.equal(calls.filter((call) => call.url.endsWith(REFRESH_PATH)).length, 1);
  });

  it('si el refresh se rechaza, borra la sesión, avisa y devuelve el 401', async () => {
    const { http, storage, calls, expiredCount } = setup(() => json(401, { error: { code: 'INVALID_REFRESH_TOKEN' } }));

    await assert.rejects(http.request('/api/v1/employees'), (err: unknown) => err instanceof SdkHttpError && err.status === 401);

    assert.equal(storage.get(), null);
    assert.equal(expiredCount(), 1);
    assert.equal(calls.length, 2);
  });

  it('sin refresh token no intenta renovar', async () => {
    const { http, calls, expiredCount } = setup(() => json(401, {}), { accessToken: 'a1', refreshToken: '' });

    await assert.rejects(http.request('/api/v1/employees'), (err: unknown) => err instanceof SdkHttpError && err.status === 401);

    assert.equal(calls.length, 1);
    assert.equal(expiredCount(), 0);
  });

  it('un 401 en una ruta pública no intenta renovar', async () => {
    const { http, calls } = setup(() => json(401, { error: { code: 'INVALID_CREDENTIALS' } }));

    await assert.rejects(http.request('/api/v1/auth/login', { method: 'POST', body: {}, auth: false }));

    assert.equal(calls.length, 1);
  });

  it('si el refresh falla por el servidor, conserva la sesión y propaga el error', async () => {
    const { http, storage, expiredCount } = setup((call) =>
      call.url.endsWith(REFRESH_PATH) ? json(500, { error: { code: 'INTERNAL' } }) : json(401, {}),
    );

    await assert.rejects(http.request('/api/v1/employees'), (err: unknown) => err instanceof SdkHttpError && err.status === 500);

    assert.deepEqual(storage.get(), { accessToken: 'a1', refreshToken: 'r1' });
    assert.equal(expiredCount(), 0);
  });
});
