import { useMemo } from 'react';
import type { Shift } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { config } from '../../../lib/config';
import { usePagedList } from '../../../lib/use-paged-list';
import { useRecordForm } from '../../../lib/use-record-form';
import { EmptyState } from '../../../components/EmptyState';
import { Icon } from '../../../components/Icon';
import { PageHeader } from '../../../components/PageHeader';
import { useAuth } from '../../auth/auth-context';
import { ShiftForm } from '../components/ShiftForm';
import { formatBlocks, toBlocks } from '../schedule-blocks';

export function ShiftsPage() {
  const { can } = useAuth();
  const params = useMemo(() => ({ status: 'active' as const, pageSize: config.catalogPageSize }), []);
  const { data, loading, error } = usePagedList('shifts', sdk.shifts, params);
  const form = useRecordForm<Shift>();

  const shifts = data?.data ?? [];

  return (
    <>
      <PageHeader title="Turnos y horarios" subtitle="Catálogo de turnos asignables a empleados.">
        {can('shifts:create') && (
          <button type="button" className="btn btn-primary" onClick={() => form.open()}>
            <Icon name="plus" /> Nuevo turno
          </button>
        )}
      </PageHeader>

      {shifts.length === 0 ? (
        <EmptyState message={loading ? 'Cargando...' : (error ?? 'No hay turnos.')} />
      ) : (
        <div className="grid grid-2">
          {shifts.map((shift) => (
            <div key={shift.shift_id} className="card">
              <div className="card-head">
                <h3 className="section-title">{shift.shift_name}</h3>
                {can('shifts:update') ? (
                  <button type="button" className="icon-btn" title="Editar" onClick={() => form.open(shift)}>
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

      {form.isOpen && (
        <ShiftForm key={form.record?.shift_id ?? 'new'} shift={form.record} onClose={form.close} onSaved={form.saved} />
      )}
    </>
  );
}
