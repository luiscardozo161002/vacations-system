import { useMemo, useState } from 'react';
import type { VacationEntitlement } from '@vacations/sdk';
import { formatDate } from '../../../lib/format';
import { DataTable, type Column } from '../../../components/DataTable';
import { useBalances } from '../hooks/useBalances';

const PAGE_SIZE = 10;

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

export function BalancesPage() {
  const [page, setPage] = useState(1);
  const params = useMemo(() => ({ status: 'active' as const, page, pageSize: PAGE_SIZE }), [page]);
  const { data, loading, error } = useBalances(params);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Días de vacaciones</h1>
          <p className="page-sub">Saldo por empleado: días y horas otorgados, usados y disponibles, por periodo.</p>
        </div>
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
          onPageChange: setPage,
        }}
      />
    </>
  );
}
