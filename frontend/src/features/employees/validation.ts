export const NAME_MIN = 3;
export const NAME_MAX = 150;
export const NUMBER_LENGTH = 4;
export const EMAIL_MAX = 120;

const NAME_CHARACTERS = /[^\p{L}\s.'-]/gu;
const NAME_PATTERN = /^\p{L}[\p{L}\s.'-]*$/u;
const NUMBER_PATTERN = new RegExp(`^\\d{${NUMBER_LENGTH}}$`);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface EmployeeValues {
  employee_name: string;
  employee_number: string;
  department_id: string;
  shift_id: string;
  start_date: string;
  email: string;
}

export type EmployeeErrors = Partial<Record<keyof EmployeeValues, string>>;

export const cleanName = (value: string) => value.replace(NAME_CHARACTERS, '');
export const cleanNumber = (value: string) => value.replace(/\D/g, '').slice(0, NUMBER_LENGTH);

const validName = (value: string) => {
  const name = value.trim();
  if (!name) return 'Escribe el nombre completo';
  if (name.length < NAME_MIN) return `El nombre necesita al menos ${NAME_MIN} caracteres`;
  if (name.length > NAME_MAX) return `El nombre admite máximo ${NAME_MAX} caracteres`;
  if (!NAME_PATTERN.test(name)) return 'El nombre solo admite letras, espacios, puntos, apóstrofos y guiones';
};

const validNumber = (value: string) => {
  if (!value) return 'Escribe el número de empleado';
  if (!NUMBER_PATTERN.test(value)) return `El número de empleado debe tener exactamente ${NUMBER_LENGTH} dígitos, sin letras`;
};

const validDate = (value: string, today: string) => {
  if (!value) return 'Indica la fecha de ingreso';
  if (!DATE_PATTERN.test(value) || Number.isNaN(Date.parse(value))) return 'La fecha de ingreso no es válida';
  if (value > today) return 'La fecha de ingreso no puede ser posterior a hoy';
};

const validEmail = (value: string) => {
  const email = value.trim();
  if (!email) return undefined;
  if (email.length > EMAIL_MAX) return `El correo electrónico admite máximo ${EMAIL_MAX} caracteres`;
  if (!EMAIL_PATTERN.test(email)) return 'El correo electrónico no es válido, por ejemplo nombre@empresa.com';
};

export const validateEmployee = (values: EmployeeValues, today: string): EmployeeErrors => {
  const errors: EmployeeErrors = {
    employee_name: validName(values.employee_name),
    employee_number: validNumber(values.employee_number),
    department_id: values.department_id ? undefined : 'Selecciona un departamento de la lista',
    shift_id: values.shift_id ? undefined : 'Selecciona un turno de la lista',
    start_date: validDate(values.start_date, today),
    email: validEmail(values.email),
  };
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message)) as EmployeeErrors;
};
