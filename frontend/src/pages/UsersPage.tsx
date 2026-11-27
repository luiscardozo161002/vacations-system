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
import { useIsGlobal } from '../hooks/use-is-global';
import { statusAction } from '../utils/status-action';
import { Select } from '../components/atoms/Select';
import { UserForm } from '../features/users/components/UserForm';
import { UserAssignment } from '../features/users/components/UserAssignment';
import { IconButton } from '../components/atoms/IconButton';
import { Button } from '../components/atoms/Button';
import { RowActions, Toolbar } from '../components/molecules/Toolbar';

const FILTERS = { estado: '' };

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'locked', label: 'Bloqueado' },
];

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
  const isGlobal = useIsGlobal();
  const { filters, page, setFilter, setPage } = usePageFilters(FILTERS);
  const params = useMemo(
    () => ({ page, pageSize: config.pageSize, sort: 'username', status: filters.estado || undefined }),
    [page, filters.estado],
  );
  const { data, loading, error } = usePagedList('users', sdk.users, params);
  const catalogs = useApiQuery(['users', 'catalogs'], loadCatalogs).data ?? NO_CATALOGS;
  const createForm = useRecordForm();
  const assignment = useRecordForm<User>();
  const [statusTarget, setStatusTarget] = useState<User | null>(null);
  const action = statusAction(isGlobal, statusTarget?.status !== 'inactive');

  const confirmStatusChange = async () => {
    if (!statusTarget) return;
    const name = statusTarget.employee_name ?? statusTarget.username;
    setStatusTarget(null);
    try {
      if (statusTarget.status === 'inactive') await sdk.users.update(statusTarget.user_id, { status: 'active' });
      else await sdk.users.remove(statusTarget.user_id);
      showToast(`${action.done} a ${name}.`);
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
    ...(isGlobal ? [{ header: 'Estado', render: (user: User) => <StatusBadge status={user.status} /> }] : []),
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
            <IconButton title={statusAction(isGlobal, user.status !== 'inactive').label} onClick={() => setStatusTarget(user)}>
              <Icon name={statusAction(isGlobal, user.status !== 'inactive').icon} />
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

      {isGlobal && (
        <Toolbar>
          <Select compact aria-label="Estado" value={filters.estado} onChange={(estado) => setFilter({ estado })} options={STATUS_OPTIONS} />
        </Toolbar>
      )}

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
        <UserForm roles={catalogs.roles} onClose={createForm.close} onSaved={createForm.saved} />
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
          title={`${action.label} usuario`}
          message={
            <>
              ¿Confirmas {action.label.toLowerCase()} a <strong>{statusTarget.employee_name ?? statusTarget.username}</strong>?
              {isGlobal ? '' : ' Dejará de aparecer y no podrá iniciar sesión.'}
            </>
          }
          confirmLabel={action.label}
          onConfirm={confirmStatusChange}
          onCancel={() => setStatusTarget(null)}
        />
      )}
    </>
  );
}
