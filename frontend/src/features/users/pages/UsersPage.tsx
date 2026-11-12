import { useEffect, useMemo, useState } from 'react';
import type { Branch, CallOptions, Company, ListUsersParams, Role, User } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { getErrorMessage } from '../../../lib/get-error-message';
import { usePagedList } from '../../../lib/use-paged-list';
import { ROLE_LABELS } from '../../../app/navigation';
import { DataTable, type Column } from '../../../components/DataTable';
import { ConfirmDialog } from '../../../components/Dialog';
import { Icon } from '../../../components/Icon';
import { StatusBadge } from '../../../components/StatusBadge';
import { useToast } from '../../../components/toast-context';
import { useAuth } from '../../auth/auth-context';
import { useActiveEmployees } from '../../employees/hooks/useActiveEmployees';
import { UserForm } from '../components/UserForm';
import { UserAssignment } from '../components/UserAssignment';

const PAGE_SIZE = 10;

const listUsers = (params: ListUsersParams, options: CallOptions) => sdk.users.list(params, options);

interface Catalogs {
  roles: Role[];
  branches: Branch[];
  companies: Company[];
}

const branchesLabel = (user: User): string => {
  if (user.role_code === 'SUPERUSER') return 'Todas';
  return user.branch_codes.join(', ') || '—';
};

export function UsersPage() {
  const showToast = useToast();
  const { can } = useAuth();
  const [page, setPage] = useState(1);
  const params = useMemo(() => ({ page, pageSize: PAGE_SIZE, sort: 'username' }), [page]);
  const { data, loading, error, reload } = usePagedList(listUsers, params);
  const { employees } = useActiveEmployees(can('users:create'));
  const [catalogs, setCatalogs] = useState<Catalogs>({ roles: [], branches: [], companies: [] });
  const [formOpen, setFormOpen] = useState(false);
  const [assigning, setAssigning] = useState<User | null>(null);
  const [statusTarget, setStatusTarget] = useState<User | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    Promise.all([
      sdk.roles.list({ status: 'active' }, options),
      sdk.branches.list({ status: 'active', pageSize: 100 }, options),
      sdk.companies.list({ status: 'active', pageSize: 100 }, options),
    ])
      .then(([roles, branches, companies]) =>
        setCatalogs({ roles: roles.data, branches: branches.data, companies: companies.data }),
      )
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const handleSaved = (message: string) => {
    setFormOpen(false);
    setAssigning(null);
    showToast(message);
    reload();
  };

  const confirmStatusChange = async () => {
    if (!statusTarget) return;
    const deactivate = statusTarget.status !== 'inactive';
    const name = statusTarget.employee_name ?? statusTarget.username;
    setStatusTarget(null);
    try {
      if (deactivate) await sdk.users.remove(statusTarget.user_id);
      else await sdk.users.update(statusTarget.user_id, { status: 'active' });
      showToast(`${name} ${deactivate ? 'desactivado' : 'reactivado'}.`);
      reload();
    } catch (err) {
      showToast(getErrorMessage(err));
    }
  };

  const columns: Column<User>[] = [
    { header: 'Nombre', render: (user) => user.employee_name ?? user.username, className: 'cell-main' },
    { header: 'Correo', render: (user) => user.email, className: 'cell-sub' },
    { header: 'Rol', render: (user) => ROLE_LABELS[user.role_code ?? ''] ?? user.role_code },
    { header: 'Sedes', render: branchesLabel, className: 'cell-sub' },
    { header: 'Estado', render: (user) => <StatusBadge status={user.status} /> },
    {
      header: '',
      render: (user) => (
        <div className="row-actions">
          {can('users:update') && (
            <button type="button" className="icon-btn" title="Asignación" onClick={() => setAssigning(user)}>
              <Icon name="edit" />
            </button>
          )}
          {can('users:delete') && (
            <button
              type="button"
              className="icon-btn"
              title={user.status === 'inactive' ? 'Reactivar' : 'Desactivar'}
              onClick={() => setStatusTarget(user)}
            >
              <Icon name={user.status === 'inactive' ? 'user-check' : 'user-x'} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Usuarios</h1>
          <p className="page-sub">Cuentas con acceso al sistema, su empresa y sedes asignadas.</p>
        </div>
        {can('users:create') && (
          <div className="page-actions">
            <button type="button" className="btn btn-primary" onClick={() => setFormOpen(true)} disabled={!catalogs.roles.length}>
              <Icon name="plus" /> Nuevo usuario
            </button>
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(user) => user.user_id}
        loading={loading}
        emptyMessage={error ?? 'No hay usuarios.'}
        pagination={{
          page,
          totalPages: data?.pagination.totalPages ?? 1,
          total: data?.pagination.total ?? 0,
          onPageChange: setPage,
        }}
      />

      {formOpen && (
        <UserForm roles={catalogs.roles} employees={employees} onClose={() => setFormOpen(false)} onSaved={handleSaved} />
      )}

      {assigning && (
        <UserAssignment
          key={assigning.user_id}
          user={assigning}
          branches={catalogs.branches}
          companies={catalogs.companies}
          onClose={() => setAssigning(null)}
          onSaved={handleSaved}
        />
      )}

      {statusTarget && (
        <ConfirmDialog
          title={statusTarget.status === 'inactive' ? 'Reactivar usuario' : 'Desactivar usuario'}
          message={
            <>
              ¿Confirmas {statusTarget.status === 'inactive' ? 'reactivar a' : 'desactivar a'}{' '}
              <strong>{statusTarget.employee_name ?? statusTarget.username}</strong>?
            </>
          }
          confirmLabel={statusTarget.status === 'inactive' ? 'Reactivar' : 'Desactivar'}
          onConfirm={confirmStatusChange}
          onCancel={() => setStatusTarget(null)}
        />
      )}
    </>
  );
}
