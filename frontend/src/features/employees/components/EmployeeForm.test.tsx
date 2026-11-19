import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Department, Employee, Shift } from '@vacations/sdk';
import { EmployeeForm } from './EmployeeForm';

const { create, update } = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('../../../services/sdk', () => ({ sdk: { employees: { create, update } } }));

const departments = [{ department_id: 1, department_name: 'Explotacion' }] as Department[];
const shifts = [{ shift_id: 2, shift_name: 'Oficinas' }] as Shift[];

const employee = {
  employee_id: 7,
  employee_name: 'Juan Perez Lopez',
  employee_number: '0001',
  department_id: 1,
  shift_id: 2,
  start_date: '2025-08-01',
} as Employee;

const renderForm = (record: Employee | null) => {
  const onSaved = vi.fn();
  render(<EmployeeForm employee={record} departments={departments} shifts={shifts} onClose={vi.fn()} onSaved={onSaved} />);
  return onSaved;
};

const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe('Alta de empleado', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('no incluye el folio y filtra letras del número y números del nombre', () => {
    renderForm(null);

    expect(screen.queryByLabelText('Folio')).toBeNull();
    type('Número de empleado', 'EMP-12345');
    type('Nombre completo', 'Luis 45');

    expect((screen.getByLabelText('Número de empleado') as HTMLInputElement).value).toBe('1234');
    expect((screen.getByLabelText('Nombre completo') as HTMLInputElement).value).toBe('Luis ');
  });

  it('al enviar vacío muestra qué falló en cada campo y no llama a la API', () => {
    renderForm(null);

    fireEvent.change(screen.getByLabelText('Fecha de ingreso'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear empleado' }));

    const messages = screen.getAllByRole('alert').map((alert) => alert.textContent);
    expect(messages).toContain('Escribe el nombre completo');
    expect(messages).toContain('Escribe el número de empleado');
    expect(messages).toContain('Indica la fecha de ingreso');
    expect(screen.getByLabelText('Nombre completo').getAttribute('aria-invalid')).toBe('true');
    expect(create).not.toHaveBeenCalled();
  });

  it('valida el correo y quita el error al corregirlo', () => {
    renderForm(null);
    type('Nombre completo', 'Laura Hernández');
    type('Número de empleado', '1234');
    type('Correo electrónico', 'sin-arroba');
    fireEvent.click(screen.getByRole('button', { name: 'Crear empleado' }));

    expect(screen.getByText(/correo electrónico no es válido/)).toBeTruthy();

    type('Correo electrónico', 'laura@empresa.com');
    expect(screen.queryByText(/correo electrónico no es válido/)).toBeNull();
  });

  it('con datos válidos crea al empleado sin folio', async () => {
    create.mockResolvedValue({ employee_name: 'Laura Hernández' });
    const onSaved = renderForm(null);
    type('Nombre completo', 'Laura Hernández');
    type('Número de empleado', '1234');
    fireEvent.click(screen.getByRole('button', { name: 'Crear empleado' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('Empleado creado.', undefined));
    const payload = create.mock.calls[0][0];
    expect(payload).toMatchObject({ employee_name: 'Laura Hernández', employee_number: '1234', department_id: 1, shift_id: 2 });
    expect(payload).not.toHaveProperty('folio');
  });
});

describe('Edición de empleado', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('abre en solo lectura y se habilita con Editar', () => {
    renderForm(employee);

    expect(screen.getByLabelText('Nombre completo').matches(':disabled')).toBe(true);
    expect(screen.queryByRole('button', { name: 'Guardar cambios' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));

    expect(screen.getByLabelText('Nombre completo').matches(':disabled')).toBe(false);
    expect(screen.queryByRole('button', { name: 'Editar' })).toBeNull();
  });

  it('solo permite guardar cuando algo cambió y envía los datos', async () => {
    update.mockResolvedValue({});
    const onSaved = renderForm(employee);
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));

    const save = screen.getByRole('button', { name: 'Guardar cambios' }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);

    type('Nombre completo', 'Juan Perez Lopez Jr');
    expect(save.disabled).toBe(false);
    fireEvent.click(save);

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('Empleado actualizado.'));
    expect(update).toHaveBeenCalledWith(7, expect.objectContaining({ employee_name: 'Juan Perez Lopez Jr', employee_number: '0001' }));
  });

  it('no guarda si un cambio deja un dato inválido', () => {
    renderForm(employee);
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));

    type('Número de empleado', '12');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(screen.getByText(/exactamente 4 dígitos/)).toBeTruthy();
    expect(update).not.toHaveBeenCalled();
  });
});
