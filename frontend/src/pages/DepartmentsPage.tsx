import { useMemo } from 'react';
import type { Department } from '@vacations/sdk';
import { sdk } from '../services/sdk';
import { config } from '../config';
import { usePagedList } from '../hooks/use-paged-list';
import { useRecordForm } from '../hooks/use-record-form';
import { formatCode } from '../utils/format';
import { departmentColor } from '../features/organization/colors';
import { ColorBadge } from '../components/atoms/ColorBadge';
import { EmptyState } from '../components/atoms/EmptyState';
import { Icon } from '../components/atoms/Icon';
import { PageHeader } from '../components/molecules/PageHeader';
import { Grid } from '../components/molecules/Grid';
import { useAuth } from '../contexts/auth-context';
import { useActiveEmployees } from '../features/employees/hooks/useActiveEmployees';
import { DepartmentForm } from '../features/departments/components/DepartmentForm';
import { useBranches } from '../features/branches/hooks/useBranches';
import { Button } from '../components/atoms/Button';
import { IconButton } from '../components/atoms/IconButton';
import { KeyValue, KeyValueGrid } from '../components/molecules/KeyValue';
import { Card, CardHeader, CardTitle } from '../components/molecules/Card';

export function DepartmentsPage() {
  const { can } = useAuth();
  const canEdit = can('departments:update');

  const params = useMemo(
    () => ({ status: 'active' as const, pageSize: config.catalogPageSize, sort: 'department_name' }),
    [],
  );
  const { data, loading, error } = usePagedList('departments', sdk.departments, params);
  const { employees } = useActiveEmployees(canEdit);
  const { branches } = useBranches(canEdit);
  const form = useRecordForm<Department>();

  const departments = data?.data ?? [];

  return (
    <>
      <PageHeader title="Departamentos" subtitle="Áreas de la organización y sus responsables.">
        {can('departments:create') && (
          <Button onClick={() => form.open()} disabled={branches.length === 0}>
            <Icon name="plus" /> Nuevo departamento
          </Button>
        )}
      </PageHeader>

      {departments.length === 0 ? (
        <EmptyState message={loading ? 'Cargando...' : (error ?? 'No hay departamentos.')} />
      ) : (
        <Grid cols={3}>
          {departments.map((department) => (
            <Card key={department.department_id} accent={departmentColor(department)}>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2">
                  {department.department_name}
                  {department.branch_code && (
                    <ColorBadge color={departmentColor(department)} title={`${department.company_name} · ${department.branch_name}`}>
                      {formatCode(department.branch_code)}
                    </ColorBadge>
                  )}
                </CardTitle>
                {canEdit && (
                  <IconButton title="Editar" onClick={() => form.open(department)}>
                    <Icon name="edit" />
                  </IconButton>
                )}
              </CardHeader>
              <KeyValueGrid>
                <KeyValue label="Responsable">{department.manager_name ?? '—'}</KeyValue>
                <KeyValue label="Empleados activos">{department.active_employees}</KeyValue>
                <KeyValue label="Calendario compartido">{department.calendar_shared ? 'Sí' : 'No'}</KeyValue>
              </KeyValueGrid>
            </Card>
          ))}
        </Grid>
      )}

      {form.isOpen && (
        <DepartmentForm
          key={form.record?.department_id ?? 'new'}
          department={form.record}
          branches={branches}
          employees={employees}
          onClose={form.close}
          onSaved={form.saved}
        />
      )}
    </>
  );
}
