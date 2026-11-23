const { resetSequence } = require('../seed-helpers');

const COMPANIES = [
  {
    company_id: 1,
    folio: 'JOR',
    company_name: 'JUÁREZ DE ORIENTE S.A. DE C.V.',
    rfc: 'JOR070518U13',
    color: '#2563eb',
    logo: 'https://i.ibb.co/1G6wdv02/Logo-JO-Profile.png',
    location: '4 Norte 8 B5, Col. Centro, Tecamachalco, Puebla, CP. 75480',
    status: 'active',
  },
  {
    company_id: 2,
    folio: 'THH',
    company_name: 'TRANSPORTES HIDRO HIDALGUENSES S.A. DE C.V.',
    rfc: 'THH981218DS0',
    color: '#16a34a',
    logo: 'https://i.ibb.co/v8HXL7F/thh-oficial-copia.png',
    location: 'Av. Tulancingo, No. 103, San Miguel Vindhó, Tula de Allende, Hidalgo',
    status: 'active',
  },
  {
    company_id: 3,
    folio: 'UMJ',
    company_name: 'UNIDAD MÉDICA INTEGRAL HIDALGUENSE, C.J. S.A. de C.V.',
    rfc: 'UMI1007285C1',
    color: '#d97706',
    logo: 'https://i.ibb.co/n8sQ05Xq/umj-logo-transparente.png',
    location: 'Zimapán s/n, Colonia San Miguel Vindhó, Tula de Allende, Hidalgo C.P. 42842',
    status: 'active',
  },
];

const BRANCHES = [
  { branch_id: 1, company_id: 1, code: 'JOR_CAMP', branch_name: 'Campeche' },
  { branch_id: 2, company_id: 1, code: 'JOR_PUEB', branch_name: 'Puebla' },
  { branch_id: 3, company_id: 1, code: 'JOR_HGO', branch_name: 'Hidalgo' },
  { branch_id: 4, company_id: 2, code: 'THH_AGS', branch_name: 'Aguascalientes' },
  { branch_id: 5, company_id: 2, code: 'THH_HGO', branch_name: 'Hidalgo' },
  { branch_id: 6, company_id: 2, code: 'THH_PUE', branch_name: 'Puebla' },
  { branch_id: 7, company_id: 3, code: 'UMJ_HGO', branch_name: 'Hidalgo' },
];

const SHIFTS = [
  { shift_id: 1, code: 'OFICINAS', shift_name: 'Oficinas', number_days: 5 },
  { shift_id: 2, code: 'OPERACIONES', shift_name: 'Operaciones', number_days: 6 },
];

const SHIFT_SCHEDULES = [
  { shift_id: 1, day_of_week: 1, is_working_day: true, check_in_time: '07:00', check_out_time: '16:00' },
  { shift_id: 1, day_of_week: 2, is_working_day: true, check_in_time: '07:00', check_out_time: '16:00' },
  { shift_id: 1, day_of_week: 3, is_working_day: true, check_in_time: '07:00', check_out_time: '16:00' },
  { shift_id: 1, day_of_week: 4, is_working_day: true, check_in_time: '07:00', check_out_time: '16:00' },
  { shift_id: 1, day_of_week: 5, is_working_day: true, check_in_time: '07:00', check_out_time: '16:00' },
  { shift_id: 1, day_of_week: 6, is_working_day: false, check_in_time: null, check_out_time: null },
  { shift_id: 1, day_of_week: 7, is_working_day: false, check_in_time: null, check_out_time: null },
  { shift_id: 2, day_of_week: 1, is_working_day: true, check_in_time: '07:00', check_out_time: '15:00' },
  { shift_id: 2, day_of_week: 2, is_working_day: true, check_in_time: '07:00', check_out_time: '15:00' },
  { shift_id: 2, day_of_week: 3, is_working_day: true, check_in_time: '07:00', check_out_time: '15:00' },
  { shift_id: 2, day_of_week: 4, is_working_day: true, check_in_time: '07:00', check_out_time: '15:00' },
  { shift_id: 2, day_of_week: 5, is_working_day: true, check_in_time: '07:00', check_out_time: '15:00' },
  { shift_id: 2, day_of_week: 6, is_working_day: true, check_in_time: '07:00', check_out_time: '13:00' },
  { shift_id: 2, day_of_week: 7, is_working_day: false, check_in_time: null, check_out_time: null },
];

const DEPARTMENTS = [
  { department_id: 1, branch_id: 5, code: 'EXP', department_name: 'Explotacion', status: 'active' },
  { department_id: 2, branch_id: 5, code: 'FYA', department_name: 'Fletes y Acarreos', status: 'active' },
  { department_id: 3, branch_id: 3, code: 'ADM', department_name: 'Administracion', status: 'active' },
  { department_id: 4, branch_id: 3, code: 'CMSP', department_name: 'Casa de Materiales', status: 'active' },
  { department_id: 5, branch_id: 4, code: 'TMC', department_name: 'Taller Mecanico Condesa', status: 'active' },
  { department_id: 6, branch_id: 7, code: 'UMIJ', department_name: 'Unidad Medica', status: 'active' },
  { department_id: 7, branch_id: 2, code: 'TX', department_name: 'Trituracion Xirgo', status: 'active' },
  { department_id: 8, branch_id: 5, code: 'ADM', department_name: 'Administracion', status: 'active' },
];

const EMPLOYEES = [
  { employee_id: 1, department_id: 1, shift_id: 2, employee_number: '0001', employee_name: 'Juan Perez Lopez', start_date: '2025-08-01', status: 'active' },
  { employee_id: 2, department_id: 1, shift_id: 2, employee_number: '0002', employee_name: 'Maria Garcia Hernandez', start_date: '2024-05-15', status: 'active' },
  { employee_id: 3, department_id: 2, shift_id: 2, employee_number: '0003', employee_name: 'Carlos Ramirez Soto', start_date: '2023-01-10', status: 'active' },
  { employee_id: 4, department_id: 2, shift_id: 2, employee_number: '0004', employee_name: 'Ana Torres Mendoza', start_date: '2021-09-01', status: 'active' },
  { employee_id: 5, department_id: 8, shift_id: 1, employee_number: '0005', employee_name: 'Roberto Jimenez Cruz', start_date: '2018-03-01', status: 'active' },
  { employee_id: 6, department_id: 4, shift_id: 2, employee_number: '0006', employee_name: 'Laura Sanchez Ortiz', start_date: '2013-06-01', status: 'active' },
  { employee_id: 7, department_id: 5, shift_id: 2, employee_number: '0007', employee_name: 'Miguel Angel Flores', start_date: '2008-02-01', status: 'active' },
  { employee_id: 8, department_id: 6, shift_id: 1, employee_number: '0008', employee_name: 'Patricia Vega Luna', start_date: '2002-11-01', status: 'active' },
  { employee_id: 9, department_id: 7, shift_id: 2, employee_number: '0009', employee_name: 'Francisco Rojas Medina', start_date: '1998-04-01', status: 'active' },
  { employee_id: 10, department_id: 1, shift_id: 2, employee_number: '0010', employee_name: 'Daniela Castro Rios', start_date: '2026-02-01', status: 'active' },
  { employee_id: 11, department_id: 1, shift_id: 2, employee_number: '0011', employee_name: 'Jorge Luis Navarro', start_date: '2020-01-15', status: 'active' },
  { employee_id: 12, department_id: 2, shift_id: 2, employee_number: '0012', employee_name: 'Sofia Hernandez Paredes', start_date: '2015-07-01', status: 'active' },
];

const DEPARTMENT_MANAGERS = [
  { department_id: 1, manager_employee_id: 11 },
  { department_id: 2, manager_employee_id: 12 },
  { department_id: 8, manager_employee_id: 5 },
];

exports.seed = async function (knex) {
  await knex('company').insert(COMPANIES);
  await resetSequence(knex, 'company', 'company_id');

  await knex('branches').insert(BRANCHES);
  await resetSequence(knex, 'branches', 'branch_id');

  await knex('shifts').insert(SHIFTS);
  await resetSequence(knex, 'shifts', 'shift_id');

  await knex('shift_schedules').insert(SHIFT_SCHEDULES);

  await knex('departments').insert(DEPARTMENTS);
  await resetSequence(knex, 'departments', 'department_id');

  await knex('employees').insert(EMPLOYEES);
  await resetSequence(knex, 'employees', 'employee_id');

  for (const { department_id, manager_employee_id } of DEPARTMENT_MANAGERS) {
    await knex('departments').where({ department_id }).update({ manager_employee_id });
  }
};
