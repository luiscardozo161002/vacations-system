import { useState } from 'react';
import type { Permission, Role, RolePermission } from '@vacations/sdk';
import { sdk } from '../services/sdk';
import { config } from '../config';
import { getErrorMessage } from '../utils/get-error-message';
import { listAll } from '../utils/list-all';
import { useApiQuery } from '../hooks/use-api-query';
import { queryClient } from '../services/query-client';
import { ROLE_LABELS } from '../layouts/navigation';
import { EmptyState } from '../components/atoms/EmptyState';
import { Icon } from '../components/atoms/Icon';
import { PageHeader } from '../components/molecules/PageHeader';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/auth-context';
import { Card } from '../components/molecules/Card';
import { cn } from '../utils/cn';
import { Checkbox } from '../components/atoms/Checkbox';
import { ConfirmDialog } from '../components/organisms/Dialog';

const cell = 'border-b border-line px-3.5 py-2.5 text-center text-sm';
const headCell = 'border-b border-line bg-subtle px-3.5 py-2.5 text-center text-xs font-semibold text-muted uppercase first:text-left';

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


interface Matrix {
  roles: Role[];
  permissionIds: Map<string, number>;
  granted: Set<string>;
}

const grantKey = (roleId: number, permissionId: number) => `${roleId}:${permissionId}`;

const MATRIX_KEY = ['permissions', 'matrix'];

const loadMatrix = async (signal: AbortSignal): Promise<Matrix> => {
  const [roles, permissions, grants]: [Role[], Permission[], RolePermission[]] = await Promise.all([
    listAll(sdk.roles, { status: 'active' as const }, signal),
    listAll(sdk.permissions, { status: 'active' as const }, signal),
    listAll(sdk.rolePermissions, { status: 'active' as const }, signal),
  ]);
  return {
    roles,
    permissionIds: new Map(permissions.map((permission) => [permission.permission_code, permission.permission_id])),
    granted: new Set(grants.map((grant) => grantKey(grant.role_id, grant.permission_id))),
  };
};

export function PermissionsPage() {
  const showToast = useToast();
  const { user, can } = useAuth();
  const canEdit = can('permissions:update');
  const { data: matrix, error } = useApiQuery(MATRIX_KEY, loadMatrix);
  const [saving, setSaving] = useState<string | null>(null);
  const [pending, setPending] = useState<{ role: Role; module: (typeof MODULES)[number] } | null>(null);

  const toggle = async (role: Role, module: (typeof MODULES)[number]) => {
    setPending(null);
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
      queryClient.setQueryData(MATRIX_KEY, { ...matrix, granted });
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
      <PageHeader title="Roles y permisos" subtitle="Matriz de permisos por módulo. Solo el Superusuario puede modificarla." />
      {!canEdit && (
        <Card className="mb-4 flex items-center gap-2.5">
          <Icon name="alert-circle" />
          <span className="text-[12.5px] text-muted">Estás viendo esta matriz en modo solo lectura con el rol actual ({roleLabel}).</span>
        </Card>
      )}
      {!matrix ? (
        <EmptyState message={error ?? 'Cargando...'} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-surface">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr>
                <th className={headCell}>Módulo</th>
                {matrix.roles.map((role) => (
                  <th key={role.role_id} className={headCell}>
                    {ROLE_LABELS[role.role_code] ?? role.role_code}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="[&_tr:last-child_td]:border-b-0">
              {MODULES.map((module) => (
                <tr key={module.code}>
                  <td className={cn(cell, 'text-left font-medium text-fg')}>
                    {module.label}
                    {module.special && <div className="text-[12.5px] font-normal text-muted">{module.special}</div>}
                  </td>
                  {matrix.roles.map((role) => {
                    const permissionId = matrix.permissionIds.get(module.code) ?? 0;
                    const key = grantKey(role.role_id, permissionId);
                    const fixed = role.role_code === config.roles.global;
                    const on = fixed || matrix.granted.has(key);
                    return (
                      <td key={role.role_id} className={cell}>
                        <Checkbox
                          checked={on}
                          disabled={fixed || !canEdit || saving === key}
                          onCheckedChange={() => setPending({ role, module })}
                          aria-label={`${module.label} para ${ROLE_LABELS[role.role_code] ?? role.role_code}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pending && matrix && (
        <ConfirmDialog
          title="Cambiar permiso"
          message={`¿${
            matrix.granted.has(grantKey(pending.role.role_id, matrix.permissionIds.get(pending.module.code) ?? 0))
              ? 'Quitar'
              : 'Dar'
          } el permiso de "${pending.module.label}" al rol ${ROLE_LABELS[pending.role.role_code] ?? pending.role.role_code}?`}
          confirmLabel="Cambiar permiso"
          onConfirm={() => toggle(pending.role, pending.module)}
          onCancel={() => setPending(null)}
        />
      )}
    </>
  );
}
