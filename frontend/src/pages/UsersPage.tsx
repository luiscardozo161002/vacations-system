import { useMemo, useState } from 'react';
import type { User } from '@vacations/sdk';
import { sdk } from '../services/sdk';
import { config } from '../config';
import { getErrorMessage } from '../utils/get-error-message';
import { formatCode } from '../utils/format';
import { usePagedList } from '../hooks/use-paged-list';
import { useApiQuery } from '../hooks/use-api-query';
import { refreshData } from '../services/query-client';
import { usePageFilters } from '../hooks/use-page-filters';
import { useRecordForm } from '../hooks/use-record-form';
import { ROLE_LABELS } from '../layouts/navigation';
import { DataTable, type Column } from '../components/organisms/DataTable';
import { ConfirmDialog } from '../components/organisms/Dialog';
import { Icon } from '../components/atoms/Icon';
import { PageHeader } from '../components/molecules/PageHeader';
import { StatusBadge } from '../components/atoms/StatusBadge';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/auth-context';
import { useActiveEmployees } from '../features/employees/hooks/useActiveEmployees';
import { UserForm } from '../features/users/components/UserForm';
import { UserAssignment } from '../features/users/components/UserAssignment';
import { IconButton } from '../components/atoms/IconButton';
import { Button } from '../components/atoms/Button';
import { RowActions } from '../components/molecules/Toolbar';

const FILTERS = {};

const loadCatalogs = async (signal: AbortSignal) => {
  const params = { status: 'active' as const, pageSize: config.catalogPageSize };
  const [roles, branches, companies] = await Promise.all([
    sdk.roles.list({ status: 'active' }, { signal }),
    sdk.branches.list(params, { signal }),
    sdk.companies.list(params, { signal }),
  ]);
  return { roles: roles.data, branches: branches.data, companies: companies.data };
};

const NO_CATALOGS = { roles: [], branches: [], companies: [] };

const branchesLabel = (user: User): string => {
  if (user.role_code === config.roles.global) return 'Todas';
  return user.branch_codes.map(formatCode).join(', ') || '—';
};

export function UsersPage() {
  const showToast = useToast();
  const { can } = useAuth();
  const { page, setPage } = usePageFilters(FILTERS);
  const params = useMemo(() => ({ page, pageSize: config.pageSize, sort: 'username' }), [page]);
  const { data, loading, error } = usePagedList('users', sdk.users, params);
  const { employees } = useActiveEmployees(can('users:create'));
  const catalogs = useApiQuery(['users', 'catalogs'], loadCatalogs).data ?? NO_CATALOGS;
  const createForm = useRecordForm();
  const assignment = useRecordForm<User>();
  const [statusTarget, setStatusTarget] = useState<User | null>(null);

  const confirmStatusChange = async () => {
    if (!statusTarget) return;
    const deactivate = statusTarget.status !== 'inactive';
    const name = statusTarget.employee_name ?? statusTarget.username;
    setStatusTarget(null);
    try {
      if (deactivate) await sdk.users.remove(statusTarget.user_id);
      else await sdk.users.update(statusTarget.user_id, { status: 'active' });
      showToast(`${name} ${deactivate ? 'desactivado' : 'reactivado'}.`);
      refreshData();
    } catch (err) {
      showToast(getErrorMessage(err));
    }
  };

  const columns: Column<User>[] = [
    { header: 'Nombre', render: (user) => user.employee_name ?? user.username, className: 'font-medium' },
    { header: 'Correo', render: (user) => user.email, className: 'text-[12.5px] text-muted' },
    { header: 'Rol', render: (user) => ROLE_LABELS[user.role_code ?? ''] ?? user.role_code },
    { header: 'Sedes', render: branchesLabel, className: 'text-[12.5px] text-muted' },
    { header: 'Estado', render: (user) => <StatusBadge status={user.status} /> },
    {
      header: '',
      render: (user) => (
        <RowActions>
          {can('users:update') && (
            <IconButton title="Asignación" onClick={() => assignment.open(user)}>
              <Icon name="edit" />
            </IconButton>
          )}
          {can('users:delete') && (
            <IconButton title={user.status === 'inactive' ? 'Reactivar' : 'Desactivar'} onClick={() => setStatusTarget(user)}>
              <Icon name={user.status === 'inactive' ? 'user-check' : 'user-x'} />
            </IconButton>
          )}
        </RowActions>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Usuarios" subtitle="Cuentas con acceso al sistema, su empresa y sedes asignadas.">
        {can('users:create') && (
          <Button onClick={() => createForm.open()} disabled={!catalogs.roles.length}>
            <Icon name="plus" /> Nuevo usuario
          </Button>
        )}
      </PageHeader>

      <DataTable
        columns={columns}
        data={data}
        rowKey={(user) => user.user_id}
        page={page}
        onPageChange={setPage}
        loading={loading}
        emptyMessage={error ?? 'No hay usuarios.'}
      />

      {createForm.isOpen && (
        <UserForm roles={catalogs.roles} employees={employees} onClose={createForm.close} onSaved={createForm.saved} />
      )}

      {assignment.record && (
        <UserAssignment
          key={assignment.record.user_id}
          user={assignment.record}
          branches={catalogs.branches}
          companies={catalogs.companies}
          onClose={assignment.close}
          onSaved={assignment.saved}
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
