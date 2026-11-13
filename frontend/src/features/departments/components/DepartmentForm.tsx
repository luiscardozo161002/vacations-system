import { useMemo, useState, type FormEvent } from 'react';
import type { Branch, Department, Employee } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { getErrorMessage } from '../../../lib/get-error-message';
import { Drawer } from '../../../components/Drawer';
import { SearchSelect } from '../../../components/SearchSelect';
import { FormField, SelectField, TextField } from '../../../components/FormField';

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

      <TextField
        id="d-name"
        label="Nombre del departamento"
        value={name}
        onChange={setName}
        placeholder="Ej. Atención a Clientes"
        maxLength={150}
        required
      />
      <TextField id="d-code" label="Código" value={code} onChange={setCode} placeholder="Ej. ATC" maxLength={20} required />
      <SelectField
        id="d-branch"
        label="Sede"
        value={branchId}
        onChange={setBranchId}
        options={branches.map((branch) => ({ value: branch.branch_id, label: `${branch.code} · ${branch.branch_name}` }))}
        required
      />
      <FormField label="Responsable" htmlFor="d-manager">
        <SearchSelect
          id="d-manager"
          options={managerOptions}
          value={managerId}
          onChange={setManagerId}
          placeholder="Buscar empleado por nombre..."
          fullWidth
        />
      </FormField>
      <FormField label="Calendario">
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 6 }}>
          <input type="checkbox" checked={calendarShared} onChange={(e) => setCalendarShared(e.target.checked)} /> Sus empleados ven
          las ausencias del departamento
        </label>
      </FormField>
    </Drawer>
  );
}
