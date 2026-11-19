import { useMemo, useState } from 'react';
import type { VacationEntitlement } from '@vacations/sdk';
import { sdk } from '../../../api/sdk';
import { config } from '../../../config';
import { getErrorMessage } from '../../../utils/get-error-message';
import { refreshData } from '../../../api/query-client';
import { usePageFilters } from '../../../hooks/use-page-filters';
import { usePagedList } from '../../../hooks/use-paged-list';
import { formatDate } from '../../../utils/format';
import { DataTable, type Column } from '../../../components/organisms/DataTable';
import { Icon } from '../../../components/atoms/Icon';
import { PageHeader } from '../../../components/molecules/PageHeader';
import { useToast } from '../../../components/organisms/toast-context';
import { useAuth } from '../../auth/auth-context';
import { EmployeeDashboard } from '../../dashboard/components/EmployeeDashboard';
import { Button } from '../../../components/atoms/Button';

const FILTERS = {};

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
  const { page, setPage } = usePageFilters(FILTERS);
  const [generating, setGenerating] = useState(false);
  const params = useMemo(() => ({ status: 'active' as const, page, pageSize: config.pageSize }), [page]);
  const { data, loading, error } = usePagedList('balances', sdk.vacationEntitlements, params);

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
      <PageHeader
        title="Días de vacaciones"
        subtitle="Saldo por empleado: días y horas otorgados, usados y disponibles, por periodo."
      >
        {canGenerate && (
          <Button variant="secondary" onClick={generate} disabled={generating}>
            <Icon name="calendar-check" /> Generar periodos
          </Button>
        )}
      </PageHeader>

      <DataTable
        columns={columns}
        data={data}
        rowKey={(balance) => balance.entitlement_id}
        page={page}
        onPageChange={setPage}
        loading={loading}
        emptyMessage={error ?? 'No hay saldos generados.'}
      />
    </>
  );
}

export function BalancesPage() {
  const { user, can } = useAuth();
  if (!can('employees:view')) return <EmployeeDashboard />;
  return <BalancesTable canGenerate={user?.role.role_code === config.roles.global} />;
}
