import { describe, expect, it } from 'vitest';
import { cleanName, cleanNumber, validateEmployee, type EmployeeValues } from './validation';

const TODAY = '2026-11-19';

const valid: EmployeeValues = {
  employee_name: 'Laura Hernández',
  employee_number: '0123',
  department_id: '1',
  shift_id: '2',
  start_date: '2026-01-15',
  birth_date: '',
  email: '',
};

const errorsFor = (changes: Partial<EmployeeValues>) => validateEmployee({ ...valid, ...changes }, TODAY);

describe('validateEmployee', () => {
  it('acepta un empleado válido, con o sin correo', () => {
    expect(errorsFor({})).toEqual({});
    expect(errorsFor({ email: 'laura@empresa.com' })).toEqual({});
  });

  it('pide el nombre y valida su largo y sus caracteres', () => {
    expect(errorsFor({ employee_name: '  ' }).employee_name).toBe('Escribe el nombre completo');
    expect(errorsFor({ employee_name: 'Al' }).employee_name).toBe('El nombre necesita al menos 3 caracteres');
    expect(errorsFor({ employee_name: 'A'.repeat(151) }).employee_name).toBe('El nombre admite máximo 150 caracteres');
    expect(errorsFor({ employee_name: '4545 Luis' }).employee_name).toMatch(/solo admite letras/);
  });

  it('exige exactamente 4 dígitos en el número de empleado', () => {
    expect(errorsFor({ employee_number: '' }).employee_number).toBe('Escribe el número de empleado');
    expect(errorsFor({ employee_number: '12' }).employee_number).toMatch(/exactamente 4 dígitos/);
    expect(errorsFor({ employee_number: '12a4' }).employee_number).toMatch(/exactamente 4 dígitos/);
  });

  it('exige departamento y turno de la lista', () => {
    expect(errorsFor({ department_id: '' }).department_id).toBe('Selecciona un departamento de la lista');
    expect(errorsFor({ shift_id: '' }).shift_id).toBe('Selecciona un turno de la lista');
  });

  it('acepta hoy o una fecha anterior, pero no una posterior', () => {
    expect(errorsFor({ start_date: TODAY }).start_date).toBeUndefined();
    expect(errorsFor({ start_date: '2026-11-20' }).start_date).toBe('La fecha de ingreso no puede ser posterior a hoy');
    expect(errorsFor({ start_date: '' }).start_date).toBe('Indica la fecha de ingreso');
    expect(errorsFor({ start_date: '2026-13-45' }).start_date).toBe('La fecha de ingreso no es válida');
  });

  it('la fecha de nacimiento es opcional y el empleado debe tener entre 15 y 100 años', () => {
    expect(errorsFor({ birth_date: '' }).birth_date).toBeUndefined();
    expect(errorsFor({ birth_date: '1990-06-15' }).birth_date).toBeUndefined();
    expect(errorsFor({ birth_date: '2011-11-19' }).birth_date).toBeUndefined();
    expect(errorsFor({ birth_date: '2011-11-20' }).birth_date).toMatch(/entre 15 y 100 años/);
    expect(errorsFor({ birth_date: '1926-11-18' }).birth_date).toMatch(/entre 15 y 100 años/);
    expect(errorsFor({ birth_date: '1990-13-45' }).birth_date).toBe('La fecha de nacimiento no es válida');
  });

  it('valida el formato del correo solo cuando se escribe', () => {
    expect(errorsFor({ email: 'sin-arroba' }).email).toMatch(/no es válido/);
    expect(errorsFor({ email: 'a@b' }).email).toMatch(/no es válido/);
    expect(errorsFor({ email: ' ' }).email).toBeUndefined();
  });
});

describe('limpieza de entradas', () => {
  it('el número solo conserva dígitos y se corta a 4', () => {
    expect(cleanNumber('EMP-12345')).toBe('1234');
  });

  it('el nombre descarta números y símbolos pero conserva acentos y apóstrofos', () => {
    expect(cleanName("María O'Brien-Núñez 2")).toBe("María O'Brien-Núñez ");
    expect(cleanName('Luis@#4')).toBe('Luis');
  });
});
