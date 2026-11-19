import { useMemo, useState } from 'react';
import type { Notice, NoticeStatus } from '@vacations/sdk';
import { sdk } from '../../../api/sdk';
import { config } from '../../../config';
import { refreshData } from '../../../api/query-client';
import { usePageFilters } from '../../../hooks/use-page-filters';
import { usePagedList } from '../../../hooks/use-paged-list';
import { useRecordForm } from '../../../hooks/use-record-form';
import { formatAbsenceRange } from '../../../utils/format';
import { Icon } from '../../../components/atoms/Icon';
import { DataTable, type Column } from '../../../components/organisms/DataTable';
import { PageHeader } from '../../../components/molecules/PageHeader';
import { StatusBadge } from '../../../components/atoms/StatusBadge';
import { useAuth } from '../../auth/auth-context';
import { useActiveEmployees } from '../../employees/hooks/useActiveEmployees';
import { useReasons } from '../../reasons/hooks/useReasons';
import { AbsenceForm } from '../components/AbsenceForm';
import { AbsenceDetail } from '../components/AbsenceDetail';

const FILTERS = { estado: '' };

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
    { header: 'Empleado', render: (notice) => notice.employee_name, className: 'cell-main' },
    { header: 'Motivo', render: (notice) => notice.reason_description },
    { header: 'Fecha', render: (notice) => formatAbsenceRange(notice) },
    { header: 'Estado', render: (notice) => <StatusBadge status={notice.status} /> },
    {
      header: '',
      render: (notice) => (
        <div className="row-actions">
          <button type="button" className="icon-btn" title="Ver detalle" onClick={() => setSelected(notice)}>
            <Icon name="eye" />
          </button>
        </div>
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
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => form.open()}
            disabled={reasons.length === 0 || employees.length === 0}
          >
            <Icon name="plus" /> Nuevo aviso
          </button>
        )}
      </PageHeader>

      <div className="toolbar">
        <select aria-label="Estado" value={filters.estado} onChange={(e) => setFilter({ estado: e.target.value })}>
          <option value="">Todos los estados</option>
          <option value="approved">Aprobado</option>
          <option value="cancelled">Cancelado</option>
        </select>
        <div className="toolbar-spacer" />
      </div>

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
