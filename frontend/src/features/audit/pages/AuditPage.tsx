import { useMemo } from 'react';
import type { AuditLogEntry } from '@vacations/sdk';
import { sdk } from '../../../api/sdk';
import { config } from '../../../config';
import { formatDateTime } from '../../../utils/format';
import { usePagedList } from '../../../hooks/use-paged-list';
import { usePageFilters } from '../../../hooks/use-page-filters';
import { DataTable, type Column } from '../../../components/organisms/DataTable';
import { Select } from '../../../components/atoms/Select';
import { PageHeader } from '../../../components/molecules/PageHeader';
import { SearchInput } from '../../../components/molecules/SearchInput';
import { StatusBadge } from '../../../components/atoms/StatusBadge';
import { Toolbar } from '../../../components/molecules/Toolbar';

const FILTERS = { resultado: '', q: '' };

const RESULT_OPTIONS = [
  { value: '', label: 'Todos los resultados' },
  { value: 'success', label: 'Exitoso' },
  { value: 'failed', label: 'Fallido' },
];

const EVENT_LABELS: Record<string, string> = {
  LOGIN_SUCCESS: 'Inicio de sesión',
  LOGIN_FAILED: 'Intento de inicio de sesión',
  LOGOUT: 'Cierre de sesión',
  TOKEN_REFRESH: 'Renovación de sesión',
  PASSWORD_RESET_REQUESTED: 'Solicitó restablecer contraseña',
  PASSWORD_RESET_COMPLETED: 'Restableció contraseña',
  PASSWORD_CHANGED: 'Cambió su contraseña',
  NOTICE_APPROVED: 'Aprobó una ausencia',
  NOTICE_REJECTED: 'Rechazó una ausencia',
  NOTICE_CANCELLED: 'Canceló una ausencia',
  EMPLOYEE_CREATED: 'Dio de alta un empleado',
  EMPLOYEE_UPDATED: 'Editó un empleado',
  EMPLOYEE_DEACTIVATED: 'Dio de baja un empleado',
  EMPLOYEE_ACCESS_GRANTED: 'Envió acceso a un empleado',
  EMPLOYEES_EXPORTED: 'Exportó empleados a CSV',
  RULE_CREATED: 'Creó una regla de acumulación',
  RULE_UPDATED: 'Editó una regla de acumulación',
  RULE_DEACTIVATED: 'Desactivó una regla de acumulación',
  USER_CREATED: 'Creó un usuario',
  USER_UPDATED: 'Editó un usuario',
  USER_DEACTIVATED: 'Desactivó un usuario',
  USER_BRANCHES_CHANGED: 'Cambió las sedes de un usuario',
  PERMISSION_GRANTED: 'Otorgó un permiso',
  PERMISSION_REVOKED: 'Quitó un permiso',
};

const ENTITY_LABELS: Record<string, string> = {
  notice: 'Ausencia',
  employee: 'Empleado',
  accrual_rule: 'Regla',
  user: 'Usuario',
  role: 'Rol',
};

const detail = (entry: AuditLogEntry): string =>
  [entry.entity && `${ENTITY_LABELS[entry.entity] ?? entry.entity} #${entry.entity_id}`, entry.ip_address]
    .filter(Boolean)
    .join(' · ');

const columns: Column<AuditLogEntry>[] = [
  { header: 'Usuario', render: (entry) => entry.username ?? 'desconocido', className: 'font-medium' },
  { header: 'Fecha y hora', render: (entry) => formatDateTime(entry.created_at), className: 'text-[12.5px] text-muted' },
  {
    header: 'Evento',
    render: (entry) => (
      <>
        {EVENT_LABELS[entry.event_type] ?? entry.event_type}
        <div className="text-[12.5px] text-muted">{detail(entry)}</div>
      </>
    ),
  },
  { header: 'Resultado', render: (entry) => <StatusBadge status={entry.result} /> },
];

export function AuditPage() {
  const { filters, page, setFilter, setPage } = usePageFilters(FILTERS);

  const params = useMemo(
    () => ({
      page,
      pageSize: config.pageSize,
      result: filters.resultado ? (filters.resultado as 'success' | 'failed') : undefined,
      search: filters.q || undefined,
    }),
    [page, filters.resultado, filters.q],
  );
  const { data, loading, error } = usePagedList('audit-log', sdk.auditLog, params);

  return (
    <>
      <PageHeader title="Auditoría" subtitle="Historial de inicio de sesión y eventos de seguridad." />
      <Toolbar>
        <Select compact aria-label="Resultado" value={filters.resultado} onChange={(resultado) => setFilter({ resultado })} options={RESULT_OPTIONS} />
        <SearchInput placeholder="Buscar usuario o evento..." value={filters.q} onSearch={(q) => setFilter({ q })} />
      </Toolbar>
      <DataTable
        columns={columns}
        data={data}
        rowKey={(entry) => entry.log_id}
        page={page}
        onPageChange={setPage}
        loading={loading}
        emptyMessage={error ?? 'No hay eventos con estos filtros.'}
      />
    </>
  );
}
