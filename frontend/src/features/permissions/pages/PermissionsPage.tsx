import { useEffect, useState } from 'react';
import type { Permission, Role, RolePermission } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { getErrorMessage } from '../../../lib/get-error-message';
import { listAll } from '../../../lib/list-all';
import { ROLE_LABELS } from '../../../app/navigation';
import { EmptyState } from '../../../components/EmptyState';
import { Icon } from '../../../components/Icon';
import { useToast } from '../../../components/toast-context';
import { useAuth } from '../../auth/auth-context';

const MODULES = [
  { code: 'dashboard:view', label: 'Dashboard', special: 'Ver estadísticas' },
  { code: 'employees:view', label: 'Empleados' },
  { code: 'departments:view', label: 'Departamentos' },
  { code: 'companies:view', label: 'Empresas' },
  { code: 'requests:view', label: 'Solicitudes' },
  { code: 'approvals:review', label: 'Aprobaciones', special: 'Aprobar / rechazar' },
  { code: 'notices:view', label: 'Avisos' },
  { code: 'calendar:view', label: 'Calendarios' },
  { code: 'balances:view', label: 'Días' },
  { code: 'rules:view', label: 'Reglas de acumulación' },
  { code: 'shifts:view', label: 'Turnos' },
  { code: 'users:view', label: 'Usuarios' },
  { code: 'permissions:view', label: 'Roles y permisos' },
  { code: 'audit:view', label: 'Auditoría' },
];

const FIXED_ROLE = 'SUPERUSER';

interface Matrix {
  roles: Role[];
  permissionIds: Map<string, number>;
  granted: Set<string>;
}

const grantKey = (roleId: number, permissionId: number) => `${roleId}:${permissionId}`;

export function PermissionsPage() {
  const showToast = useToast();
  const { user, can } = useAuth();
  const canEdit = can('permissions:update');
  const [matrix, setMatrix] = useState<Matrix | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    Promise.all([
      listAll((params, options) => sdk.roles.list(params, options), { status: 'active' as const }, signal),
      listAll((params, options) => sdk.permissions.list(params, options), { status: 'active' as const }, signal),
      listAll((params, options) => sdk.rolePermissions.list(params, options), { status: 'active' as const }, signal),
    ])
      .then(([roles, permissions, grants]: [Role[], Permission[], RolePermission[]]) =>
        setMatrix({
          roles,
          permissionIds: new Map(permissions.map((permission) => [permission.permission_code, permission.permission_id])),
          granted: new Set(grants.map((grant) => grantKey(grant.role_id, grant.permission_id))),
        }),
      )
      .catch((err: unknown) => {
        if (!signal.aborted) setError(getErrorMessage(err));
      });
    return () => controller.abort();
  }, []);

  const toggle = async (role: Role, module: (typeof MODULES)[number]) => {
    if (!matrix) return;
    const permissionId = matrix.permissionIds.get(module.code);
    if (!permissionId) return;
    const key = grantKey(role.role_id, permissionId);
    const isOn = matrix.granted.has(key);

    setSaving(key);
    try {
      if (isOn) await sdk.rolePermissions.remove(role.role_id, permissionId);
      else await sdk.rolePermissions.create({ role_id: role.role_id, permission_id: permissionId });
      const granted = new Set(matrix.granted);
      if (isOn) granted.delete(key);
      else granted.add(key);
      setMatrix({ ...matrix, granted });
      showToast(`Permiso de "${module.label}" actualizado para ${ROLE_LABELS[role.role_code] ?? role.role_code}.`);
    } catch (err) {
      showToast(getErrorMessage(err));
    } finally {
      setSaving(null);
    }
  };

  const roleLabel = ROLE_LABELS[user?.role.role_code ?? ''] ?? user?.role.role_code;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Roles y permisos</h1>
          <p className="page-sub">Matriz de permisos por módulo. Solo el Superusuario puede modificarla.</p>
        </div>
      </div>
      {!canEdit && (
        <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
          <span data-icon="alert-circle">
            <Icon name="alert-circle" />
          </span>
          <span className="cell-sub">Estás viendo esta matriz en modo solo lectura con el rol actual ({roleLabel}).</span>
        </div>
      )}
      {!matrix ? (
        <EmptyState message={error ?? 'Cargando...'} />
      ) : (
        <div className="matrix-wrap">
          <table className="matrix">
            <thead>
              <tr>
                <th>Módulo</th>
                {matrix.roles.map((role) => (
                  <th key={role.role_id}>{ROLE_LABELS[role.role_code] ?? role.role_code}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULES.map((module) => (
                <tr key={module.code}>
                  <td>
                    {module.label}
                    {module.special && <div className="cell-sub">{module.special}</div>}
                  </td>
                  {matrix.roles.map((role) => {
                    const permissionId = matrix.permissionIds.get(module.code) ?? 0;
                    const key = grantKey(role.role_id, permissionId);
                    const fixed = role.role_code === FIXED_ROLE;
                    const on = fixed || matrix.granted.has(key);
                    return (
                      <td key={role.role_id}>
                        <button
                          type="button"
                          className={`chk ${on ? 'on' : ''}`}
                          disabled={fixed || !canEdit || saving === key}
                          onClick={() => toggle(role, module)}
                          aria-label={`${module.label} para ${ROLE_LABELS[role.role_code] ?? role.role_code}`}
                        >
                          {on && <Icon name="check" />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
