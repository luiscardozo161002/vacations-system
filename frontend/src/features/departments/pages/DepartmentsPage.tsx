import { useMemo } from 'react';
import type { Department } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { config } from '../../../lib/config';
import { usePagedList } from '../../../lib/use-paged-list';
import { useRecordForm } from '../../../lib/use-record-form';
import { EmptyState } from '../../../components/EmptyState';
import { Icon } from '../../../components/Icon';
import { PageHeader } from '../../../components/PageHeader';
import { useAuth } from '../../auth/auth-context';
import { useActiveEmployees } from '../../employees/hooks/useActiveEmployees';
import { DepartmentForm } from '../components/DepartmentForm';
import { useBranches } from '../../branches/hooks/useBranches';

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
  const repeatedNames = new Set(departments.map((department) => department.department_name)).size < departments.length;

  return (
    <>
      <PageHeader title="Departamentos" subtitle="Áreas de la organización y sus responsables.">
        {can('departments:create') && (
          <button type="button" className="btn btn-primary" onClick={() => form.open()} disabled={branches.length === 0}>
            <Icon name="plus" /> Nuevo departamento
          </button>
        )}
      </PageHeader>

      {departments.length === 0 ? (
        <EmptyState message={loading ? 'Cargando...' : (error ?? 'No hay departamentos.')} />
      ) : (
        <div className="grid grid-3">
          {departments.map((department) => (
            <div key={department.department_id} className="card">
              <div className="card-head">
                <h3 className="section-title">
                  {department.department_name}
                  {repeatedNames && <span className="cell-sub"> · {department.branch_code}</span>}
                </h3>
                {canEdit && (
                  <button type="button" className="icon-btn" title="Editar" onClick={() => form.open(department)}>
                    <Icon name="edit" />
                  </button>
                )}
              </div>
              <div className="kv-grid">
                <div className="kv-item">
                  <div className="k">Responsable</div>
                  <div className="v">{department.manager_name ?? '—'}</div>
                </div>
                <div className="kv-item">
                  <div className="k">Empleados activos</div>
                  <div className="v">{department.active_employees}</div>
                </div>
                <div className="kv-item">
                  <div className="k">Calendario compartido</div>
                  <div className="v">{department.calendar_shared ? 'Sí' : 'No'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
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
