import { useMemo, useState, type FormEvent } from 'react';
import type { Branch, Department, Employee } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { getErrorMessage } from '../../../lib/get-error-message';
import { Drawer } from '../../../components/Drawer';
import { SearchSelect } from '../../../components/SearchSelect';

interface DepartmentFormProps {
  department: Department | null;
  branches: Branch[];
  employees: Employee[];
  onClose: () => void;
  onSaved: (message: string) => void;
}

export function DepartmentForm({ department, branches, employees, onClose, onSaved }: DepartmentFormProps) {
  const [name, setName] = useState(department?.department_name ?? '');
  const [code, setCode] = useState(department?.code ?? '');
  const [branchId, setBranchId] = useState(String(department?.branch_id ?? branches[0]?.branch_id ?? ''));
  const [managerId, setManagerId] = useState(department?.manager_employee_id ? String(department.manager_employee_id) : '');
  const [calendarShared, setCalendarShared] = useState(department?.calendar_shared ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const managerOptions = useMemo(
    () =>
      employees.map((employee) => ({
        value: String(employee.employee_id),
        label: `${employee.employee_number} · ${employee.employee_name}`,
      })),
    [employees],
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('El nombre del departamento es obligatorio.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    const payload = {
      department_name: name.trim(),
      code: code.trim(),
      branch_id: Number(branchId),
      manager_employee_id: managerId ? Number(managerId) : null,
      calendar_shared: calendarShared,
    };
    try {
      if (department) {
        await sdk.departments.update(department.department_id, payload);
        onSaved('Departamento actualizado.');
      } else {
        await sdk.departments.create(payload);
        onSaved('Departamento creado.');
      }
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      title={department ? 'Editar departamento' : 'Nuevo departamento'}
      onClose={onClose}
      onSubmit={handleSubmit}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {department ? 'Guardar cambios' : 'Crear departamento'}
          </button>
        </>
      }
    >
      {formError && <p className="field-error">{formError}</p>}

      <div className="field">
        <label htmlFor="d-name">Nombre del departamento</label>
        <input
          id="d-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Atención a Clientes"
          maxLength={150}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="d-code">Código</label>
        <input id="d-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ej. ATC" maxLength={20} required />
      </div>
      <div className="field">
        <label htmlFor="d-branch">Sede</label>
        <select id="d-branch" value={branchId} onChange={(e) => setBranchId(e.target.value)} required>
          {branches.map((branch) => (
            <option key={branch.branch_id} value={branch.branch_id}>
              {branch.code} · {branch.branch_name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="d-manager">Responsable</label>
        <SearchSelect
          id="d-manager"
          options={managerOptions}
          value={managerId}
          onChange={setManagerId}
          placeholder="Buscar empleado por nombre..."
          fullWidth
        />
      </div>
      <div className="field">
        <label>Calendario</label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 6 }}>
          <input type="checkbox" checked={calendarShared} onChange={(e) => setCalendarShared(e.target.checked)} /> Sus empleados ven
          las ausencias del departamento
        </label>
      </div>
    </Drawer>
  );
}
