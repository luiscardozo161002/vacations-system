import { useMemo, useState } from 'react';
import type { Notice, NoticeStatus } from '@vacations/sdk';
import { formatAbsenceRange } from '../../../lib/format';
import { Icon } from '../../../components/Icon';
import { DataTable, type Column } from '../../../components/DataTable';
import { StatusBadge } from '../../../components/StatusBadge';
import { useToast } from '../../../components/toast-context';
import { useAuth } from '../../auth/auth-context';
import { useActiveEmployees } from '../../employees/hooks/useActiveEmployees';
import { useReasons } from '../../reasons/hooks/useReasons';
import { useNotices } from '../hooks/useNotices';
import { AbsenceForm } from '../components/AbsenceForm';
import { AbsenceDetail } from '../components/AbsenceDetail';

const PAGE_SIZE = 10;

export function NoticesPage() {
  const showToast = useToast();
  const { user, can } = useAuth();
  const canRegister = can('notices:create');

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<Notice | null>(null);

  const { reasons } = useReasons();
  const { employees } = useActiveEmployees(canRegister);

  const params = useMemo(
    () => ({
      kind: 'notice' as const,
      page,
      pageSize: PAGE_SIZE,
      status: statusFilter ? (statusFilter as NoticeStatus) : undefined,
      sort: '-request_date',
    }),
    [page, statusFilter],
  );

  const { data, loading, error, reload } = useNotices(params);

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

  const handleSaved = () => {
    setFormOpen(false);
    showToast('Aviso registrado.');
    reload();
  };

  const handleChanged = () => {
    setSelected(null);
    reload();
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{canRegister ? 'Avisos' : 'Mis avisos'}</h1>
          <p className="page-sub">
            {canRegister
              ? 'Avisos de ausencia que Recursos Humanos registra para los empleados de sus sedes.'
              : 'Tus avisos de ausencia registrados por Recursos Humanos.'}
          </p>
        </div>
        {canRegister && (
          <div className="page-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setFormOpen(true)}
              disabled={reasons.length === 0 || employees.length === 0}
            >
              <Icon name="plus" /> Nuevo aviso
            </button>
          </div>
        )}
      </div>

      <div className="toolbar">
        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value);
          }}
        >
          <option value="">Todos los estados</option>
          <option value="approved">Aprobado</option>
          <option value="cancelled">Cancelado</option>
        </select>
        <div className="toolbar-spacer" />
      </div>

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(notice) => notice.notice_id}
        loading={loading}
        emptyMessage={error ?? 'No hay avisos registrados.'}
        pagination={{
          page,
          totalPages: data?.pagination.totalPages ?? 1,
          total: data?.pagination.total ?? 0,
          onPageChange: setPage,
        }}
      />

      {formOpen && (
        <AbsenceForm
          title="Nuevo aviso"
          submitLabel="Registrar aviso"
          reasons={reasons}
          employees={employees}
          onClose={() => setFormOpen(false)}
          onSaved={handleSaved}
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
