import { useMemo, useState } from 'react';
import type { Notice, NoticeStatus } from '@vacations/sdk';
import { sdk } from '../services/sdk';
import { config } from '../config';
import { refreshData } from '../services/query-client';
import { usePageFilters } from '../hooks/use-page-filters';
import { usePagedList } from '../hooks/use-paged-list';
import { useRecordForm } from '../hooks/use-record-form';
import { formatAbsenceRange, formatDaysHours } from '../utils/format';
import { Icon } from '../components/atoms/Icon';
import { DataTable, type Column } from '../components/organisms/DataTable';
import { Select } from '../components/atoms/Select';
import { PageHeader } from '../components/molecules/PageHeader';
import { PersonCell } from '../components/molecules/PersonCell';
import { SearchSelect } from '../components/molecules/SearchSelect';
import { StatusBadge } from '../components/atoms/StatusBadge';
import { useAuth } from '../contexts/auth-context';
import { useDepartments } from '../features/departments/hooks/useDepartments';
import { useReasons } from '../features/reasons/hooks/useReasons';
import { AbsenceForm } from '../features/requests/components/AbsenceForm';
import { AbsenceDetail } from '../features/requests/components/AbsenceDetail';
import { IconButton } from '../components/atoms/IconButton';
import { Button } from '../components/atoms/Button';
import { RowActions, Toolbar, ToolbarSpacer } from '../components/molecules/Toolbar';

const FILTERS = { estado: '', departamento: '' };

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'approved', label: 'Aprobada' },
  { value: 'rejected', label: 'Rechazada' },
  { value: 'cancelled', label: 'Cancelada' },
];

export function RequestsPage() {
  const { user, can } = useAuth();
  const isEmployee = !can('departments:view');
  const canCreate = can('requests:create') && Boolean(user?.employee);

  const { filters, page, setFilter, setPage } = usePageFilters(FILTERS);
  const form = useRecordForm();
  const [selected, setSelected] = useState<Notice | null>(null);

  const { departments } = useDepartments(!isEmployee);
  const { reasons } = useReasons();

  const params = useMemo(
    () => ({
      kind: 'request' as const,
      page,
      pageSize: config.pageSize,
      status: filters.estado ? (filters.estado as NoticeStatus) : undefined,
      department_id: filters.departamento ? Number(filters.departamento) : undefined,
      sort: '-request_date',
    }),
    [page, filters.estado, filters.departamento],
  );

  const { data, loading, error } = usePagedList('notices', sdk.notices, params);

  const departmentOptions = useMemo(
    () => departments.map((department) => ({ value: String(department.department_id), label: department.department_name })),
    [departments],
  );

  const columns: Column<Notice>[] = [
    { header: 'Empleado', render: (notice) => <PersonCell name={notice.employee_name} /> },
    { header: 'Departamento', render: (notice) => notice.department_name },
    { header: 'Fecha y horario', render: (notice) => formatAbsenceRange(notice) },
    { header: 'Días', render: (notice) => formatDaysHours(notice.days_taken, notice.hours_taken) },
    { header: 'Motivo', render: (notice) => notice.reason_description },
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
        title={isEmployee ? 'Mis solicitudes de avisos de ausencia' : 'Solicitudes de avisos de ausencia'}
        subtitle={
          isEmployee
            ? 'Tus solicitudes de vacaciones, con fecha y, si aplica, horario de inicio y fin.'
            : 'Solicitudes de vacaciones de los empleados, con fecha y, si aplica, horario de inicio y fin.'
        }
      >
        {canCreate && (
          <Button onClick={() => form.open()} disabled={reasons.length === 0}>
            <Icon name="plus" /> Nueva solicitud
          </Button>
        )}
      </PageHeader>

      <Toolbar>
        <Select compact aria-label="Estado" value={filters.estado} onChange={(estado) => setFilter({ estado })} options={STATUS_OPTIONS} />
        {!isEmployee && (
          <SearchSelect
            id="req-dept-filter"
            options={departmentOptions}
            value={filters.departamento}
            onChange={(value) => setFilter({ departamento: value })}
            placeholder="Todos los departamentos"
          />
        )}
        <ToolbarSpacer />
      </Toolbar>

      <DataTable
        columns={columns}
        data={data}
        rowKey={(notice) => notice.notice_id}
        page={page}
        onPageChange={setPage}
        loading={loading}
        emptyMessage={error ?? 'No hay solicitudes con estos filtros.'}
      />

      {form.isOpen && user?.employee && (
        <AbsenceForm
          title="Nueva solicitud de aviso de ausencia"
          submitLabel="Enviar solicitud"
          reasons={reasons}
          employee={user.employee}
          onClose={form.close}
          onSaved={() => form.saved('Solicitud enviada, queda pendiente de aprobación.')}
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
