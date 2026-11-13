import { useMemo } from 'react';
import type { AuditLogEntry, CallOptions, ListAuditLogParams } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { formatDateTime } from '../../../lib/format';
import { usePagedList } from '../../../lib/use-paged-list';
import { useUrlFilters } from '../../../lib/use-url-filters';
import { DataTable, type Column } from '../../../components/DataTable';
import { SearchInput } from '../../../components/SearchInput';
import { StatusBadge } from '../../../components/StatusBadge';

const PAGE_SIZE = 10;
const FILTERS = { resultado: '', q: '', pagina: '1' };

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

const listAudit = (params: ListAuditLogParams, options: CallOptions) => sdk.auditLog.list(params, options);

const columns: Column<AuditLogEntry>[] = [
  { header: 'Usuario', render: (entry) => entry.username ?? 'desconocido', className: 'cell-main' },
  { header: 'Fecha y hora', render: (entry) => formatDateTime(entry.created_at), className: 'cell-sub' },
  {
    header: 'Evento',
    render: (entry) => (
      <>
        {EVENT_LABELS[entry.event_type] ?? entry.event_type}
        <div className="cell-sub">{detail(entry)}</div>
      </>
    ),
  },
  { header: 'Resultado', render: (entry) => <StatusBadge status={entry.result} /> },
];

export function AuditPage() {
  const [filters, setFilters] = useUrlFilters(FILTERS);
  const page = Number(filters.pagina);


  const params = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      result: filters.resultado ? (filters.resultado as 'success' | 'failed') : undefined,
      search: filters.q || undefined,
    }),
    [page, filters.resultado, filters.q],
  );
  const { data, loading, error } = usePagedList('audit-log', listAudit, params);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Auditoría</h1>
          <p className="page-sub">Historial de inicio de sesión y eventos de seguridad.</p>
        </div>
      </div>
      <div className="toolbar">
        <select
          value={filters.resultado}
          onChange={(e) => setFilters({ resultado: e.target.value, pagina: '1' })}
        >
          <option value="">Todos los resultados</option>
          <option value="success">Exitoso</option>
          <option value="failed">Fallido</option>
        </select>
        <SearchInput
          placeholder="Buscar usuario o evento..."
          value={filters.q}
          onSearch={(q) => setFilters({ q, pagina: '1' })}
        />
      </div>
      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(entry) => entry.log_id}
        loading={loading}
        emptyMessage={error ?? 'No hay eventos con estos filtros.'}
        pagination={{
          page,
          totalPages: data?.pagination.totalPages ?? 1,
          total: data?.pagination.total ?? 0,
          onPageChange: (next) => setFilters({ pagina: String(next) }),
        }}
      />
    </>
  );
}
