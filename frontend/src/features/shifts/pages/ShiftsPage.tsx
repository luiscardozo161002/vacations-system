import { useMemo } from 'react';
import type { Shift } from '@vacations/sdk';
import { sdk } from '../../../api/sdk';
import { config } from '../../../config';
import { usePagedList } from '../../../hooks/use-paged-list';
import { useRecordForm } from '../../../hooks/use-record-form';
import { EmptyState } from '../../../components/atoms/EmptyState';
import { Icon } from '../../../components/atoms/Icon';
import { PageHeader } from '../../../components/molecules/PageHeader';
import { useAuth } from '../../auth/auth-context';
import { ShiftForm } from '../components/ShiftForm';
import { formatBlocks, toBlocks } from '../schedule-blocks';
import { Button } from '../../../components/atoms/Button';
import { IconButton } from '../../../components/atoms/IconButton';
import { Card, CardHeader, CardTitle } from '../../../components/molecules/Card';
import { Divider } from '../../../components/atoms/Divider';

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
          <Button onClick={() => form.open()}>
            <Icon name="plus" /> Nuevo turno
          </Button>
        )}
      </PageHeader>

      {shifts.length === 0 ? (
        <EmptyState message={loading ? 'Cargando...' : (error ?? 'No hay turnos.')} />
      ) : (
        <div className="grid grid-2">
          {shifts.map((shift) => (
            <Card key={shift.shift_id}>
              <CardHeader>
                <CardTitle>{shift.shift_name}</CardTitle>
                {can('shifts:update') ? (
                  <IconButton title="Editar" onClick={() => form.open(shift)}>
                    <Icon name="edit" />
                  </IconButton>
                ) : (
                  <span data-icon="clock">
                    <Icon name="clock" />
                  </span>
                )}
              </CardHeader>
              <p className="text-[12.5px] text-muted">{formatBlocks(toBlocks(shift.schedule)) || 'Sin horario definido'}</p>
              <Divider />
              <p className="text-[12.5px] text-muted">{shift.active_employees} empleados asignados</p>
            </Card>
          ))}
        </div>
      )}

      {form.isOpen && (
        <ShiftForm key={form.record?.shift_id ?? 'new'} shift={form.record} onClose={form.close} onSaved={form.saved} />
      )}
    </>
  );
}
