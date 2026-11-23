import { useMemo, useState } from 'react';
import type { Branch, Department, Employee } from '@vacations/sdk';
import { sdk } from '../../../services/sdk';
import { useFormSubmit } from '../../../hooks/use-form-submit';
import { formatCode } from '../../../utils/format';
import { FormDrawer } from '../../../components/organisms/FormDrawer';
import { CheckboxRow } from '../../../components/molecules/CheckboxRow';
import { SearchSelect } from '../../../components/molecules/SearchSelect';
import { FormField, SelectField, TextField } from '../../../components/molecules/FormField';

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
  const { submitting, error, setError, submit } = useFormSubmit();

  const managerOptions = useMemo(
    () =>
      employees.map((employee) => ({
        value: String(employee.employee_id),
        label: `${employee.employee_number} · ${employee.employee_name}`,
      })),
    [employees],
  );

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('El nombre del departamento es obligatorio.');
      return;
    }

    const payload = {
      department_name: name.trim(),
      code: code.trim(),
      branch_id: Number(branchId),
      manager_employee_id: managerId ? Number(managerId) : null,
      calendar_shared: calendarShared,
    };
    submit(async () => {
      if (department) {
        await sdk.departments.update(department.department_id, payload);
        onSaved('Departamento actualizado.');
      } else {
        await sdk.departments.create(payload);
        onSaved('Departamento creado.');
      }
    });
  };

  return (
    <FormDrawer
      title={department ? 'Editar departamento' : 'Nuevo departamento'}
      submitLabel={department ? 'Guardar cambios' : 'Crear departamento'}
      confirm={department ? `¿Guardar los cambios de ${department.department_name}?` : undefined}
      submitting={submitting}
      error={error}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
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
        options={branches.map((branch) => ({ value: branch.branch_id, label: `${formatCode(branch.code)} · ${branch.branch_name}` }))}
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
        <CheckboxRow checked={calendarShared} onCheckedChange={(checked) => setCalendarShared(checked === true)}>
          Sus empleados ven las ausencias del departamento
        </CheckboxRow>
      </FormField>
    </FormDrawer>
  );
}
