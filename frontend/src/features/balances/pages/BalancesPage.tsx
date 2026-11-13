import { useMemo, useState } from 'react';
import { sdk } from '../../../lib/sdk';
import { getErrorMessage } from '../../../lib/get-error-message';
import { refreshData } from '../../../lib/query-client';
import { useUrlFilters } from '../../../lib/use-url-filters';
import { Icon } from '../../../components/Icon';
import { useToast } from '../../../components/toast-context';
import type { VacationEntitlement } from '@vacations/sdk';
import { formatDate } from '../../../lib/format';
import { DataTable, type Column } from '../../../components/DataTable';
import { useBalances } from '../hooks/useBalances';
import { useAuth } from '../../auth/auth-context';
import { EmployeeDashboard } from '../../dashboard/components/EmployeeDashboard';

const PAGE_SIZE = 10;
const FILTERS = { pagina: '1' };

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

const columns: Column<VacationEntitlement>[] = [
  { header: 'Empleado', render: (balance) => balance.employee_name, className: 'cell-main' },
  { header: 'Departamento', render: (balance) => balance.department_name },
  { header: 'Antigüedad', render: (balance) => plural(balance.years_of_service, 'año') },
  { header: 'Otorgados', render: (balance) => `${balance.total_days} días` },
  { header: 'Días usados', render: (balance) => `${balance.used_days} días` },
  { header: 'Días disponibles', render: (balance) => `${balance.available.days} días` },
  { header: 'Horas usadas', render: (balance) => `${balance.used_hours} h` },
  {
    header: 'Horas disponibles',
    render: (balance) => (
      <>
        {balance.available.hours} h <span className="cell-sub">(de {balance.daily_hours}h/día)</span>
      </>
    ),
  },
  {
    header: 'Periodo',
    render: (balance) => `${formatDate(balance.period_start)} – ${formatDate(balance.period_end)}`,
  },
];

function BalancesTable({ canGenerate }: { canGenerate: boolean }) {
  const showToast = useToast();
  const [filters, setFilters] = useUrlFilters(FILTERS);
  const page = Number(filters.pagina);
  const [generating, setGenerating] = useState(false);
  const params = useMemo(() => ({ status: 'active' as const, page, pageSize: PAGE_SIZE }), [page]);
  const { data, loading, error } = useBalances(params);

  const generate = async () => {
    setGenerating(true);
    try {
      const summary = await sdk.vacationEntitlements.generate();
      showToast(
        `Periodos al día: ${summary.created} abiertos, ${summary.expired} vencidos y ${summary.reminders} avisos enviados.`
      );
      refreshData();
    } catch (err) {
      showToast(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Días de vacaciones</h1>
          <p className="page-sub">Saldo por empleado: días y horas otorgados, usados y disponibles, por periodo.</p>
        </div>
        {canGenerate && (
          <div className="page-actions">
            <button type="button" className="btn btn-secondary" onClick={generate} disabled={generating}>
              <Icon name="calendar-check" /> Generar periodos
            </button>
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(balance) => balance.entitlement_id}
        loading={loading}
        emptyMessage={error ?? 'No hay saldos generados.'}
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

export function BalancesPage() {
  const { user, can } = useAuth();
  if (!can('employees:view')) return <EmployeeDashboard />;
  return <BalancesTable canGenerate={user?.role.role_code === 'SUPERUSER'} />;
}
