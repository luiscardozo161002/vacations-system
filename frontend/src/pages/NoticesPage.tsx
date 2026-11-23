import { useMemo, useState } from 'react';
import type { Notice, NoticeStatus } from '@vacations/sdk';
import { sdk } from '../services/sdk';
import { config } from '../config';
import { refreshData } from '../services/query-client';
import { usePageFilters } from '../hooks/use-page-filters';
import { usePagedList } from '../hooks/use-paged-list';
import { useRecordForm } from '../hooks/use-record-form';
import { formatAbsenceRange } from '../utils/format';
import { Icon } from '../components/atoms/Icon';
import { DataTable, type Column } from '../components/organisms/DataTable';
import { Select } from '../components/atoms/Select';
import { PageHeader } from '../components/molecules/PageHeader';
import { PersonCell } from '../components/molecules/PersonCell';
import { StatusBadge } from '../components/atoms/StatusBadge';
import { useAuth } from '../contexts/auth-context';
import { useActiveEmployees } from '../features/employees/hooks/useActiveEmployees';
import { useReasons } from '../features/reasons/hooks/useReasons';
import { AbsenceForm } from '../features/requests/components/AbsenceForm';
import { AbsenceDetail } from '../features/requests/components/AbsenceDetail';
import { IconButton } from '../components/atoms/IconButton';
import { Button } from '../components/atoms/Button';
import { RowActions, Toolbar, ToolbarSpacer } from '../components/molecules/Toolbar';

const FILTERS = { estado: '' };

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'approved', label: 'Aprobado' },
  { value: 'cancelled', label: 'Cancelado' },
];

export function NoticesPage() {
  const { user, can } = useAuth();
  const canRegister = can('notices:create');

  const { filters, page, setFilter, setPage } = usePageFilters(FILTERS);
  const form = useRecordForm();
  const [selected, setSelected] = useState<Notice | null>(null);

  const { reasons } = useReasons();
  const { employees } = useActiveEmployees(canRegister);

  const params = useMemo(
    () => ({
      kind: 'notice' as const,
      page,
      pageSize: config.pageSize,
      status: filters.estado ? (filters.estado as NoticeStatus) : undefined,
      sort: '-request_date',
    }),
    [page, filters.estado],
  );

  const { data, loading, error } = usePagedList('notices', sdk.notices, params);

  const columns: Column<Notice>[] = [
    { header: 'Empleado', render: (notice) => <PersonCell name={notice.employee_name} /> },
    { header: 'Motivo', render: (notice) => notice.reason_description },
    { header: 'Fecha', render: (notice) => formatAbsenceRange(notice) },
    { header: 'Estado', render: (notice) => <StatusBadge status={notice.status} /> },
    {
      header: '',
      render: (notice) => (
        <RowActions>
          <IconButton title="Ver detalle" onClick={() => setSelected(notice)}>
            <Icon name="eye" />
          </IconButton>
        </RowActions>
      ),
    },
  ];

  const handleChanged = () => {
    setSelected(null);
    refreshData();
  };

  return (
    <>
      <PageHeader
        title={canRegister ? 'Avisos' : 'Mis avisos'}
        subtitle={
          canRegister
            ? 'Avisos de ausencia que Recursos Humanos registra para los empleados de sus sedes.'
            : 'Tus avisos de ausencia registrados por Recursos Humanos.'
        }
      >
        {canRegister && (
          <Button onClick={() => form.open()} disabled={reasons.length === 0 || employees.length === 0}>
            <Icon name="plus" /> Nuevo aviso
          </Button>
        )}
      </PageHeader>

      <Toolbar>
        <Select compact aria-label="Estado" value={filters.estado} onChange={(estado) => setFilter({ estado })} options={STATUS_OPTIONS} />
        <ToolbarSpacer />
      </Toolbar>

      <DataTable
        columns={columns}
        data={data}
        rowKey={(notice) => notice.notice_id}
        page={page}
        onPageChange={setPage}
        loading={loading}
        emptyMessage={error ?? 'No hay avisos registrados.'}
      />

      {form.isOpen && (
        <AbsenceForm
          title="Nuevo aviso"
          submitLabel="Registrar aviso"
          reasons={reasons}
          employees={employees}
          onClose={form.close}
          onSaved={() => form.saved('Aviso registrado.')}
        />
      )}

      {selected && user && (
        <AbsenceDetail
          key={selected.notice_id}
          notice={selected}
          user={user}
          can={can}
          onClose={() => setSelected(null)}
          onChanged={handleChanged}
        />
      )}
    </>
  );
}
