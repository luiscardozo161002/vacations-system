import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { VacationsSdk } from '../src';
import { json, mockFetch } from './mock-fetch';

const baseUrl = 'http://api.test';

let restore: () => void = () => undefined;

afterEach(() => restore());

const setup = () => {
  const mock = mockFetch(() => json(200, {}));
  restore = mock.restore;
  return { sdk: new VacationsSdk({ baseUrl }), calls: mock.calls };
};

const sent = (calls: { method: string; url: string }[]) => calls.map((call) => `${call.method} ${call.url.replace(baseUrl, '')}`);

describe('CrudResource', () => {
  it('arma list, get, create, update y remove sobre la ruta del recurso', async () => {
    const { sdk, calls } = setup();

    await sdk.companies.list({ status: 'active', page: 2 });
    await sdk.companies.get(1);
    await sdk.companies.create({ folio: 'JOR', company_name: 'JOR' });
    await sdk.companies.update(1, { rfc: 'X' });
    await sdk.companies.remove(1);

    assert.deepEqual(sent(calls), [
      'GET /api/v1/companies?status=active&page=2',
      'GET /api/v1/companies/1',
      'POST /api/v1/companies',
      'PATCH /api/v1/companies/1',
      'DELETE /api/v1/companies/1',
    ]);
    assert.deepEqual(calls[3].body, { rfc: 'X' });
  });

  it('cada recurso apunta a su ruta de la API', async () => {
    const { sdk, calls } = setup();

    await sdk.branches.list();
    await sdk.reasons.list();
    await sdk.vacationEntitlements.list({ employee_id: 3 });
    await sdk.accrualRules.list();
    await sdk.users.list();
    await sdk.roles.list();
    await sdk.permissions.list();
    await sdk.employees.list();
    await sdk.departments.list();
    await sdk.shifts.list();

    assert.deepEqual(sent(calls), [
      'GET /api/v1/branches',
      'GET /api/v1/reasons',
      'GET /api/v1/vacation-entitlements?employee_id=3',
      'GET /api/v1/vacation-accrual-rules',
      'GET /api/v1/users',
      'GET /api/v1/roles',
      'GET /api/v1/permissions',
      'GET /api/v1/employees',
      'GET /api/v1/departments',
      'GET /api/v1/shifts',
    ]);
  });
});

describe('sdk.notices', () => {
  it('preview, alta y acciones usan sus rutas', async () => {
    const { sdk, calls } = setup();
    const request = { employee_id: 1, reason_id: 5, absence_start_date: '2027-01-11', absence_end_date: '2027-01-15' };

    await sdk.notices.list({ kind: 'request', from: '2027-01-01', to: '2027-01-31' });
    await sdk.notices.preview(request);
    await sdk.notices.create({ ...request, remarks: 'Viaje' });
    await sdk.notices.update(7, { remarks: 'Otro' });
    await sdk.notices.approve(7);
    await sdk.notices.reject(7);
    await sdk.notices.cancel(7);

    assert.deepEqual(sent(calls), [
      'GET /api/v1/notices?kind=request&from=2027-01-01&to=2027-01-31',
      'POST /api/v1/notices/preview',
      'POST /api/v1/notices',
      'PATCH /api/v1/notices/7',
      'POST /api/v1/notices/7/approve',
      'POST /api/v1/notices/7/reject',
      'POST /api/v1/notices/7/cancel',
    ]);
    assert.deepEqual(calls[1].body, request);
  });
});

describe('rutas especiales', () => {
  it('sedes de un usuario, permisos de un rol, horario de turno y auditoría', async () => {
    const { sdk, calls } = setup();

    await sdk.users.branches(2);
    await sdk.users.replaceBranches(2, [5, 3]);
    await sdk.rolePermissions.get(1, 4);
    await sdk.rolePermissions.remove(1, 4);
    await sdk.shifts.replaceSchedule(1, []);
    await sdk.auditLog.list({ event_type: 'LOGIN_FAILED' });
    await sdk.calendar.get({ from: '2026-11-01', to: '2026-11-30' });
    await sdk.dashboard.summary();
    await sdk.dashboard.me();
    await sdk.notifications.list();
    await sdk.notifications.markAllRead();
    await sdk.vacationEntitlements.generate('2027-08-01');

    assert.deepEqual(sent(calls), [
      'GET /api/v1/users/2/branches',
      'PUT /api/v1/users/2/branches',
      'GET /api/v1/role-permissions/1/4',
      'DELETE /api/v1/role-permissions/1/4',
      'PUT /api/v1/shifts/1/schedule',
      'GET /api/v1/auth-audit-log?event_type=LOGIN_FAILED',
      'GET /api/v1/calendar?from=2026-11-01&to=2026-11-30',
      'GET /api/v1/dashboard/summary',
      'GET /api/v1/dashboard/me',
      'GET /api/v1/me/notifications',
      'POST /api/v1/me/notifications/read',
      'POST /api/v1/vacation-entitlements/generate',
    ]);
    assert.deepEqual(calls[1].body, { branch_ids: [5, 3] });
  });
});
