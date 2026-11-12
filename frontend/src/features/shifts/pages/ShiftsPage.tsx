import { useMemo, useState } from 'react';
import type { CallOptions, ListShiftsParams, Shift } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { usePagedList } from '../../../lib/use-paged-list';
import { EmptyState } from '../../../components/EmptyState';
import { Icon } from '../../../components/Icon';
import { useToast } from '../../../components/toast-context';
import { useAuth } from '../../auth/auth-context';
import { ShiftForm } from '../components/ShiftForm';
import { formatBlocks, toBlocks } from '../schedule-blocks';

const listShifts = (params: ListShiftsParams, options: CallOptions) => sdk.shifts.list(params, options);

export function ShiftsPage() {
  const showToast = useToast();
  const { can } = useAuth();
  const params = useMemo(() => ({ status: 'active' as const, pageSize: 100 }), []);
  const { data, loading, error, reload } = usePagedList(listShifts, params);
  const [editing, setEditing] = useState<Shift | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const shifts = data?.data ?? [];

  const openForm = (shift: Shift | null) => {
    setEditing(shift);
    setFormOpen(true);
  };

  const handleSaved = (message: string) => {
    setFormOpen(false);
    showToast(message);
    reload();
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Turnos y horarios</h1>
          <p className="page-sub">Catálogo de turnos asignables a empleados.</p>
        </div>
        {can('shifts:create') && (
          <div className="page-actions">
            <button type="button" className="btn btn-primary" onClick={() => openForm(null)}>
              <Icon name="plus" /> Nuevo turno
            </button>
          </div>
        )}
      </div>

      {shifts.length === 0 ? (
        <EmptyState message={loading ? 'Cargando...' : (error ?? 'No hay turnos.')} />
      ) : (
        <div className="grid grid-2">
          {shifts.map((shift) => (
            <div key={shift.shift_id} className="card">
              <div className="card-head">
                <h3 className="section-title">{shift.shift_name}</h3>
                {can('shifts:update') ? (
                  <button type="button" className="icon-btn" title="Editar" onClick={() => openForm(shift)}>
                    <Icon name="edit" />
                  </button>
                ) : (
                  <span data-icon="clock">
                    <Icon name="clock" />
                  </span>
                )}
              </div>
              <p className="cell-sub">{formatBlocks(toBlocks(shift.schedule)) || 'Sin horario definido'}</p>
              <div className="divider" />
              <p className="cell-sub">{shift.active_employees} empleados asignados</p>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <ShiftForm key={editing?.shift_id ?? 'new'} shift={editing} onClose={() => setFormOpen(false)} onSaved={handleSaved} />
      )}
    </>
  );
}
