import { useMemo, useState } from 'react';
import type { CallOptions, Department, ListDepartmentsParams } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { usePagedList } from '../../../lib/use-paged-list';
import { refreshData } from '../../../lib/query-client';
import { EmptyState } from '../../../components/EmptyState';
import { Icon } from '../../../components/Icon';
import { useToast } from '../../../components/toast-context';
import { useAuth } from '../../auth/auth-context';
import { useActiveEmployees } from '../../employees/hooks/useActiveEmployees';
import { DepartmentForm } from '../components/DepartmentForm';
import { useBranches } from '../../branches/hooks/useBranches';

const listDepartments = (params: ListDepartmentsParams, options: CallOptions) => sdk.departments.list(params, options);

export function DepartmentsPage() {
  const showToast = useToast();
  const { can } = useAuth();
  const canEdit = can('departments:update');

  const params = useMemo(() => ({ status: 'active' as const, pageSize: 100, sort: 'department_name' }), []);
  const { data, loading, error } = usePagedList('departments', listDepartments, params);
  const { employees } = useActiveEmployees(canEdit);
  const { branches } = useBranches(canEdit);
  const [editing, setEditing] = useState<Department | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const departments = data?.data ?? [];
  const repeatedNames = new Set(departments.map((department) => department.department_name)).size < departments.length;

  const openForm = (department: Department | null) => {
    setEditing(department);
    setFormOpen(true);
  };

  const handleSaved = (message: string) => {
    setFormOpen(false);
    showToast(message);
    refreshData();
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Departamentos</h1>
          <p className="page-sub">Áreas de la organización y sus responsables.</p>
        </div>
        {can('departments:create') && (
          <div className="page-actions">
            <button type="button" className="btn btn-primary" onClick={() => openForm(null)} disabled={branches.length === 0}>
              <Icon name="plus" /> Nuevo departamento
            </button>
          </div>
        )}
      </div>

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
                  <button type="button" className="icon-btn" title="Editar" onClick={() => openForm(department)}>
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

      {formOpen && (
        <DepartmentForm
          key={editing?.department_id ?? 'new'}
          department={editing}
          branches={branches}
          employees={employees}
          onClose={() => setFormOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
