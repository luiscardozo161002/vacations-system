import { useMemo, useState } from 'react';
import type { Notice, NoticeStatus } from '@vacations/sdk';
import { formatAbsenceRange, formatDaysHours } from '../../../lib/format';
import { Icon } from '../../../components/Icon';
import { DataTable, type Column } from '../../../components/DataTable';
import { SearchSelect } from '../../../components/SearchSelect';
import { StatusBadge } from '../../../components/StatusBadge';
import { useToast } from '../../../components/toast-context';
import { useAuth } from '../../auth/auth-context';
import { useDepartments } from '../../departments/hooks/useDepartments';
import { useReasons } from '../../reasons/hooks/useReasons';
import { useNotices } from '../hooks/useNotices';
import { AbsenceForm } from '../components/AbsenceForm';
import { AbsenceDetail } from '../components/AbsenceDetail';

const PAGE_SIZE = 10;

export function RequestsPage() {
  const showToast = useToast();
  const { user, can } = useAuth();
  const isEmployee = !can('departments:view');
  const canCreate = can('requests:create') && Boolean(user?.employee);

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<Notice | null>(null);

  const { departments } = useDepartments(!isEmployee);
  const { reasons } = useReasons();

  const params = useMemo(
    () => ({
      kind: 'request' as const,
      page,
      pageSize: PAGE_SIZE,
      status: statusFilter ? (statusFilter as NoticeStatus) : undefined,
      department_id: departmentFilter ? Number(departmentFilter) : undefined,
      sort: '-request_date',
    }),
    [page, statusFilter, departmentFilter],
  );

  const { data, loading, error, reload } = useNotices(params);

  const departmentOptions = useMemo(
    () => departments.map((department) => ({ value: String(department.department_id), label: department.department_name })),
    [departments],
  );

  const columns: Column<Notice>[] = [
    { header: 'Empleado', render: (notice) => notice.employee_name, className: 'cell-main' },
    { header: 'Departamento', render: (notice) => notice.department_name },
    { header: 'Fecha y horario', render: (notice) => formatAbsenceRange(notice) },
    { header: 'Días', render: (notice) => formatDaysHours(notice.days_taken, notice.hours_taken) },
    { header: 'Motivo', render: (notice) => notice.reason_description },
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
    showToast('Solicitud enviada, queda pendiente de aprobación.');
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
          <h1>{isEmployee ? 'Mis solicitudes de avisos de ausencia' : 'Solicitudes de avisos de ausencia'}</h1>
          <p className="page-sub">
            {isEmployee
              ? 'Tus solicitudes de vacaciones, con fecha y, si aplica, horario de inicio y fin.'
              : 'Solicitudes de vacaciones de los empleados, con fecha y, si aplica, horario de inicio y fin.'}
          </p>
        </div>
        {canCreate && (
          <div className="page-actions">
            <button type="button" className="btn btn-primary" onClick={() => setFormOpen(true)} disabled={reasons.length === 0}>
              <Icon name="plus" /> Nueva solicitud
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
          <option value="pending">Pendiente</option>
          <option value="approved">Aprobada</option>
          <option value="rejected">Rechazada</option>
          <option value="cancelled">Cancelada</option>
        </select>
        {!isEmployee && (
          <SearchSelect
            id="req-dept-filter"
            options={departmentOptions}
            value={departmentFilter}
            onChange={(value) => {
              setPage(1);
              setDepartmentFilter(value);
            }}
            placeholder="Todos los departamentos"
          />
        )}
        <div className="toolbar-spacer" />
      </div>

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(notice) => notice.notice_id}
        loading={loading}
        emptyMessage={error ?? 'No hay solicitudes con estos filtros.'}
        pagination={{
          page,
          totalPages: data?.pagination.totalPages ?? 1,
          total: data?.pagination.total ?? 0,
          onPageChange: setPage,
        }}
      />

      {formOpen && user?.employee && (
        <AbsenceForm
          title="Nueva solicitud de aviso de ausencia"
          submitLabel="Enviar solicitud"
          reasons={reasons}
          employee={user.employee}
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
