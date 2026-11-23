import { useMemo, useState } from 'react';
import type { VacationEntitlement } from '@vacations/sdk';
import { sdk } from '../services/sdk';
import { config } from '../config';
import { getErrorMessage } from '../utils/get-error-message';
import { refreshData } from '../services/query-client';
import { usePageFilters } from '../hooks/use-page-filters';
import { usePagedList } from '../hooks/use-paged-list';
import { formatDate, formatDaysHours } from '../utils/format';
import { DataTable, type Column } from '../components/organisms/DataTable';
import { Icon } from '../components/atoms/Icon';
import { PageHeader } from '../components/molecules/PageHeader';
import { PersonCell } from '../components/molecules/PersonCell';
import { SearchInput } from '../components/molecules/SearchInput';
import { Toolbar } from '../components/molecules/Toolbar';
import { OrgFilters } from '../features/organization/components/OrgFilters';
import { ORG_FILTERS, orgParams } from '../features/organization/org-filters';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/auth-context';
import { EmployeeDashboard } from '../features/dashboard/components/EmployeeDashboard';
import { Button } from '../components/atoms/Button';
import { ConfirmDialog } from '../components/organisms/Dialog';

const FILTERS = { q: '', ...ORG_FILTERS };

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

const columns: Column<VacationEntitlement>[] = [
  { header: 'Empleado', render: (balance) => <PersonCell name={balance.employee_name} /> },
  { header: 'Departamento', render: (balance) => balance.department_name },
  { header: 'Antigüedad', render: (balance) => plural(balance.years_of_service, 'año') },
  { header: 'Otorgados', render: (balance) => `${balance.total_days} días` },
  { header: 'Usados', render: (balance) => formatDaysHours(balance.used_days, balance.used_hours) },
  { header: 'Disponibles', render: (balance) => formatDaysHours(balance.available.days, balance.available.hours) },
  {
    header: 'Horas disponibles',
    render: (balance) => (
      <>
        {balance.available.hours} h <span className="text-[12.5px] text-muted">(de {balance.daily_hours}h/día)</span>
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
  const { filters, page, setFilter, setPage } = usePageFilters(FILTERS);
  const [generating, setGenerating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const params = useMemo(
    () => ({ status: 'active' as const, page, pageSize: config.pageSize, search: filters.q || undefined, ...orgParams(filters) }),
    [page, filters],
  );
  const { data, loading, error } = usePagedList('balances', sdk.vacationEntitlements, params);

  const generate = async () => {
    setConfirming(false);
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
          <Button variant="secondary" onClick={() => setConfirming(true)} disabled={generating}>
            <Icon name="calendar-check" /> Generar periodos
          </Button>
        )}
      </PageHeader>

      <Toolbar>
        <SearchInput id="bal-search" placeholder="Buscar por nombre o número..." value={filters.q} onSearch={(q) => setFilter({ q })} />
        <OrgFilters idPrefix="bal" filters={filters} setFilter={setFilter} />
      </Toolbar>

      <DataTable
        columns={columns}
        data={data}
        rowKey={(balance) => balance.entitlement_id}
        page={page}
        onPageChange={setPage}
        loading={loading}
        emptyMessage={error ?? 'No hay saldos generados.'}
      />
      {confirming && (
        <ConfirmDialog
          title="Generar periodos"
          message="¿Abrir los periodos de vacaciones que faltan, vencer los que ya terminaron y enviar los avisos pendientes?"
          confirmLabel="Generar periodos"
          onConfirm={generate}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
}

export function BalancesPage() {
  const { user, can } = useAuth();
  if (!can('employees:view')) return <EmployeeDashboard />;
  return <BalancesTable canGenerate={user?.role.role_code === config.roles.global} />;
}
