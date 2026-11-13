const password = require('../../lib/password');
const { computeRequestBreakdown } = require('../../lib/request-breakdown');

const DEV_PASSWORD = 'Vacaciones2026!';

exports.seed = async function (knex) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('El seed borra todas las tablas; no se corre en produccion');
  }

  const devPasswordHash = await password.hash(DEV_PASSWORD);

  // ---------- Borrado (orden inverso de dependencias) ----------
  await knex('notices').del();
  await knex('vacation_entitlements').del();
  await knex('reasons').del();
  await knex('vacation_accrual_rules').del();
  await knex('auth_audit_log').del();
  await knex('password_reset_tokens').del();
  await knex('user_sessions').del();
  await knex('user_branches').del();
  await knex('users').del();
  await knex('departments').update({ manager_employee_id: null });
  await knex('employees').del();
  await knex('departments').del();
  await knex('branches').del();
  await knex('shift_schedules').del();
  await knex('shifts').del();
  await knex('company').del();

  // ---------- ORGANIZACION ----------

  await knex('company').insert([
    {
      company_id: 1,
      folio: 'JOR',
      company_name: 'JUÁREZ DE ORIENTE S.A. DE C.V.',
      rfc: 'JOR070518U13',
      logo: 'https://i.ibb.co/1G6wdv02/Logo-JO-Profile.png',
      location: '4 Norte 8 B5, Col. Centro, Tecamachalco, Puebla, CP. 75480',
      status: 'active',
    },
    {
      company_id: 2,
      folio: 'THH',
      company_name: 'TRANSPORTES HIDRO HIDALGUENSES S.A. DE C.V.',
      rfc: 'THH981218DS0',
      logo: 'https://i.ibb.co/v8HXL7F/thh-oficial-copia.png',
      location: 'Av. Tulancingo, No. 103, San Miguel Vindhó, Tula de Allende, Hidalgo',
      status: 'active',
    },
    {
      company_id: 3,
      folio: 'UMJ',
      company_name: 'UNIDAD MÉDICA INTEGRAL HIDALGUENSE, C.J. S.A. de C.V.',
      rfc: 'UMI1007285C1',
      logo: 'https://i.ibb.co/n8sQ05Xq/umj-logo-transparente.png',
      location: 'Zimapán s/n, Colonia San Miguel Vindhó, Tula de Allende, Hidalgo C.P. 42842',
      status: 'active',
    },
  ]);
  await knex.raw("SELECT setval(pg_get_serial_sequence('company','company_id'), (SELECT MAX(company_id) FROM company))");

  await knex('branches').insert([
    { branch_id: 1, company_id: 1, code: 'JOR_CAMP', branch_name: 'Campeche' },
    { branch_id: 2, company_id: 1, code: 'JOR_PUEB', branch_name: 'Puebla' },
    { branch_id: 3, company_id: 1, code: 'JOR_HGO', branch_name: 'Hidalgo' },
    { branch_id: 4, company_id: 2, code: 'THH_AGS', branch_name: 'Aguascalientes' },
    { branch_id: 5, company_id: 2, code: 'THH_HGO', branch_name: 'Hidalgo' },
    { branch_id: 6, company_id: 2, code: 'THH_PUE', branch_name: 'Puebla' },
    { branch_id: 7, company_id: 3, code: 'UMJ_HGO', branch_name: 'Hidalgo' },
  ]);
  await knex.raw("SELECT setval(pg_get_serial_sequence('branches','branch_id'), (SELECT MAX(branch_id) FROM branches))");

  await knex('shifts').insert([
    { shift_id: 1, code: 'OFICINAS', shift_name: 'Oficinas', number_days: 5 },
    { shift_id: 2, code: 'OPERACIONES', shift_name: 'Operaciones', number_days: 6 },
  ]);
  await knex.raw("SELECT setval(pg_get_serial_sequence('shifts','shift_id'), (SELECT MAX(shift_id) FROM shifts))");

  await knex('shift_schedules').insert([
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
    { shift_id: 2, day_of_week: 6, is_working_day: true, check_in_time: '08:00', check_out_time: '13:00' },
    { shift_id: 2, day_of_week: 7, is_working_day: false, check_in_time: null, check_out_time: null },
  ]);

  await knex('departments').insert([
    { department_id: 1, branch_id: 5, code: 'EXP', department_name: 'Explotacion', status: 'active' },
    { department_id: 2, branch_id: 5, code: 'FYA', department_name: 'Fletes y Acarreos', status: 'active' },
    { department_id: 3, branch_id: 3, code: 'ADM', department_name: 'Administracion', status: 'active' },
    { department_id: 4, branch_id: 3, code: 'CMSP', department_name: 'Casa de Materiales', status: 'active' },
    { department_id: 5, branch_id: 4, code: 'TMC', department_name: 'Taller Mecanico Condesa', status: 'active' },
    { department_id: 6, branch_id: 7, code: 'UMIJ', department_name: 'Unidad Medica', status: 'active' },
    { department_id: 7, branch_id: 2, code: 'TX', department_name: 'Trituracion Xirgo', status: 'active' },
    { department_id: 8, branch_id: 5, code: 'ADM', department_name: 'Administracion', status: 'active' },
  ]);
  await knex.raw("SELECT setval(pg_get_serial_sequence('departments','department_id'), (SELECT MAX(department_id) FROM departments))");

  await knex('employees').insert([
    { employee_id: 1, department_id: 1, shift_id: 2, folio: '01', employee_number: 'EMP-001', employee_name: 'Juan Perez Lopez', start_date: '2025-08-01', status: 'active' },
    { employee_id: 2, department_id: 1, shift_id: 2, folio: '02', employee_number: 'EMP-002', employee_name: 'Maria Garcia Hernandez', start_date: '2024-05-15', status: 'active' },
    { employee_id: 3, department_id: 2, shift_id: 2, folio: '03', employee_number: 'EMP-003', employee_name: 'Carlos Ramirez Soto', start_date: '2023-01-10', status: 'active' },
    { employee_id: 4, department_id: 2, shift_id: 2, folio: '04', employee_number: 'EMP-004', employee_name: 'Ana Torres Mendoza', start_date: '2021-09-01', status: 'active' },
    { employee_id: 5, department_id: 8, shift_id: 1, folio: '05', employee_number: 'EMP-005', employee_name: 'Roberto Jimenez Cruz', start_date: '2018-03-01', status: 'active' },
    { employee_id: 6, department_id: 4, shift_id: 2, folio: '06', employee_number: 'EMP-006', employee_name: 'Laura Sanchez Ortiz', start_date: '2013-06-01', status: 'active' },
    { employee_id: 7, department_id: 5, shift_id: 2, folio: '07', employee_number: 'EMP-007', employee_name: 'Miguel Angel Flores', start_date: '2008-02-01', status: 'active' },
    { employee_id: 8, department_id: 6, shift_id: 1, folio: '08', employee_number: 'EMP-008', employee_name: 'Patricia Vega Luna', start_date: '2002-11-01', status: 'active' },
    { employee_id: 9, department_id: 7, shift_id: 2, folio: '09', employee_number: 'EMP-009', employee_name: 'Francisco Rojas Medina', start_date: '1998-04-01', status: 'active' },
    { employee_id: 10, department_id: 1, shift_id: 2, folio: '10', employee_number: 'EMP-010', employee_name: 'Daniela Castro Rios', start_date: '2026-02-01', status: 'active' },
    { employee_id: 11, department_id: 1, shift_id: 2, folio: '11', employee_number: 'EMP-011', employee_name: 'Jorge Luis Navarro', start_date: '2020-01-15', status: 'active' },
    { employee_id: 12, department_id: 2, shift_id: 2, folio: '12', employee_number: 'EMP-012', employee_name: 'Sofia Hernandez Paredes', start_date: '2015-07-01', status: 'active' },
  ]);
  await knex.raw("SELECT setval(pg_get_serial_sequence('employees','employee_id'), (SELECT MAX(employee_id) FROM employees))");

  // Jefaturas (solo donde ya hay empleados en el departamento)
  await knex('departments').where('department_id', 1).update({ manager_employee_id: 11 }); // EXP -> Jorge Luis Navarro
  await knex('departments').where('department_id', 2).update({ manager_employee_id: 12 }); // FYA -> Sofia Hernandez Paredes
  await knex('departments').where('department_id', 8).update({ manager_employee_id: 5 }); // ADM -> Roberto Jimenez Cruz

  // ---------- AUTENTICACION Y AUTORIZACION ----------

  const roleIds = Object.fromEntries((await knex('roles').select('role_id', 'role_code')).map((r) => [r.role_code, r.role_id]));

  await knex('users').insert([
    { user_id: 1, employee_id: null, role_id: roleIds.SUPERUSER, username: 'sysadmin', email: 'sysadmin@grupo-jo.com', password_hash: devPasswordHash, status: 'active' },
    { user_id: 2, employee_id: 5, role_id: roleIds.USER, username: 'r.jimenez', email: 'r.jimenez@thh.com.mx', password_hash: devPasswordHash, status: 'active' },
    { user_id: 3, employee_id: 11, role_id: roleIds.EMPLOYEE, username: 'j.navarro', email: 'j.navarro@jo.com.mx', password_hash: devPasswordHash, status: 'active' },
    { user_id: 4, employee_id: 1, role_id: roleIds.EMPLOYEE, username: 'j.perez', email: 'j.perez@jo.com.mx', password_hash: devPasswordHash, status: 'active' },
  ]);
  await knex.raw("SELECT setval(pg_get_serial_sequence('users','user_id'), (SELECT MAX(user_id) FROM users))");

  await knex('user_branches').insert([{ user_id: 2, branch_id: 5 }]);

  await knex('user_sessions').insert([
    { user_id: 2, refresh_token_hash: 'REFRESH_TOKEN_HASH_DEMO_1', ip_address: '10.0.0.15', user_agent: 'Mozilla/5.0 (Windows NT 10.0)', issued_at: knex.fn.now(), expires_at: knex.raw("now() + interval '7 days'") },
    { user_id: 4, refresh_token_hash: 'REFRESH_TOKEN_HASH_DEMO_2', ip_address: '10.0.0.42', user_agent: 'Mozilla/5.0 (Windows NT 10.0)', issued_at: knex.fn.now(), expires_at: knex.raw("now() + interval '7 days'") },
  ]);

  await knex('password_reset_tokens').insert([
    { user_id: 4, token_hash: 'RESET_TOKEN_HASH_DEMO', expires_at: knex.raw("now() + interval '1 hour'") },
  ]);

  await knex('auth_audit_log').insert([
    { user_id: 1, event_type: 'LOGIN_SUCCESS', ip_address: '10.0.0.5', user_agent: 'Mozilla/5.0', metadata: null, created_at: knex.raw("now() - interval '3 days'") },
    { user_id: 2, event_type: 'LOGIN_SUCCESS', ip_address: '10.0.0.15', user_agent: 'Mozilla/5.0', metadata: null, created_at: knex.raw("now() - interval '1 day'") },
    { user_id: 3, event_type: 'LOGIN_SUCCESS', ip_address: '10.0.0.20', user_agent: 'Mozilla/5.0', metadata: null, created_at: knex.raw("now() - interval '6 hours'") },
    { user_id: 4, event_type: 'LOGIN_SUCCESS', ip_address: '10.0.0.42', user_agent: 'Mozilla/5.0', metadata: null, created_at: knex.raw("now() - interval '2 hours'") },
    { user_id: null, event_type: 'LOGIN_FAILED', result: 'failed', ip_address: '201.1.2.3', user_agent: 'curl/8.0', metadata: JSON.stringify({ attempted_login: 'admin' }), created_at: knex.raw("now() - interval '5 hours'") },
  ]);

  // ---------- VACACIONES ----------

  // Reforma "vacaciones dignas" (Art. 76 LFT, vigente desde 2023)
  await knex('vacation_accrual_rules').insert([
    { rule_id: 1, years_from: 1, years_to: 1, vacation_days: 12, effective_year: 2023, status: 'active' },
    { rule_id: 2, years_from: 2, years_to: 2, vacation_days: 14, effective_year: 2023, status: 'active' },
    { rule_id: 3, years_from: 3, years_to: 3, vacation_days: 16, effective_year: 2023, status: 'active' },
    { rule_id: 4, years_from: 4, years_to: 4, vacation_days: 18, effective_year: 2023, status: 'active' },
    { rule_id: 5, years_from: 5, years_to: 5, vacation_days: 20, effective_year: 2023, status: 'active' },
    { rule_id: 6, years_from: 6, years_to: 10, vacation_days: 22, effective_year: 2023, status: 'active' },
    { rule_id: 7, years_from: 11, years_to: 15, vacation_days: 24, effective_year: 2023, status: 'active' },
    { rule_id: 8, years_from: 16, years_to: 20, vacation_days: 26, effective_year: 2023, status: 'active' },
    { rule_id: 9, years_from: 21, years_to: 25, vacation_days: 28, effective_year: 2023, status: 'active' },
    { rule_id: 10, years_from: 26, years_to: 30, vacation_days: 30, effective_year: 2023, status: 'active' },
    { rule_id: 11, years_from: 31, years_to: 35, vacation_days: 32, effective_year: 2023, status: 'active' },
  ]);
  await knex.raw("SELECT setval(pg_get_serial_sequence('vacation_accrual_rules','rule_id'), (SELECT MAX(rule_id) FROM vacation_accrual_rules))");

  // Saldo del periodo actual: la antiguedad se calcula en la propia consulta con age().
  // Daniela Castro Rios (employee_id = 10) no genera fila si aun no cumple su primer anio.
  await knex.raw(`
    INSERT INTO vacation_entitlements
        (employee_id, period_year, years_of_service, rule_id, total_days, used_days, period_start, period_end)
    SELECT
        e.employee_id,
        EXTRACT(YEAR FROM CURRENT_DATE)::int,
        EXTRACT(YEAR FROM age(CURRENT_DATE, e.start_date))::int AS years_of_service,
        r.rule_id,
        r.vacation_days,
        0,
        (e.start_date + make_interval(years => EXTRACT(YEAR FROM age(CURRENT_DATE, e.start_date))::int))::date,
        (e.start_date + make_interval(years => EXTRACT(YEAR FROM age(CURRENT_DATE, e.start_date))::int + 1) - INTERVAL '1 day')::date
    FROM employees e
    JOIN vacation_accrual_rules r
        ON EXTRACT(YEAR FROM age(CURRENT_DATE, e.start_date))::int BETWEEN r.years_from AND COALESCE(r.years_to, 999)
       AND r.status = 'active'
       AND r.effective_year = (SELECT MAX(effective_year) FROM vacation_accrual_rules WHERE effective_year <= EXTRACT(YEAR FROM CURRENT_DATE)::int)
  `);


  // ---------- AVISOS DE AUSENCIA ----------

  await knex('reasons').insert([
    { reason_id: 1, description: 'Permiso Personal', requires_approval: true, affects_vacation_balance: false },
    { reason_id: 2, description: 'Castigo', requires_approval: true, affects_vacation_balance: false },
    { reason_id: 3, description: 'Onomástico', requires_approval: true, affects_vacation_balance: false },
    { reason_id: 4, description: 'Comisión De Trabajo', requires_approval: true, affects_vacation_balance: false },
    { reason_id: 5, description: 'Vacaciones', requires_approval: true, affects_vacation_balance: true },
    { reason_id: 6, description: 'Tiempo Por Tiempo', requires_approval: true, affects_vacation_balance: false },
    { reason_id: 7, description: 'Natalicio', requires_approval: true, affects_vacation_balance: false },
    { reason_id: 8, description: 'Deceso', requires_approval: true, affects_vacation_balance: false },
  ]);
  await knex.raw("SELECT setval(pg_get_serial_sequence('reasons','reason_id'), (SELECT MAX(reason_id) FROM reasons))");

  await knex.raw(`
    INSERT INTO notices
        (employee_id, reason_id, approved_by, status, absence_start_date, absence_end_date,
         absence_start_time, absence_end_time, days_taken, remarks, request_date, approved_at)
    VALUES
    (1,  5, 2,    'approved', CURRENT_DATE - 20, CURRENT_DATE - 16, NULL,    NULL,    5,   'Vacaciones de fin de anio',                                now() - INTERVAL '25 days', now() - INTERVAL '24 days'),
    (2,  1, NULL, 'pending',  CURRENT_DATE,      CURRENT_DATE,      '09:00', '11:00', 0,   'Cita medica',                                              now() - INTERVAL '1 day',   NULL),
    (5,  5, 1,    'approved', CURRENT_DATE - 40, CURRENT_DATE - 31, NULL,    NULL,    10,  'Vacaciones familiares',                                   now() - INTERVAL '45 days', now() - INTERVAL '44 days'),
    (6,  4, 2,    'approved', CURRENT_DATE - 10, CURRENT_DATE - 8,  NULL,    NULL,    0,   'Entrega en sucursal Pachuca',                              now() - INTERVAL '12 days', now() - INTERVAL '11 days'),
    (7,  3, NULL, 'approved', CURRENT_DATE,      CURRENT_DATE,      NULL,    NULL,    0,   'Dia de cumpleanos',                                        now(),                      now()),
    (9,  6, NULL, 'pending',  CURRENT_DATE + 3,  CURRENT_DATE + 3,  '07:00', '15:00', 0,   'Compensacion por guardia',                                 now(),                      NULL),
    (11, 2, 2,    'rejected', CURRENT_DATE - 5,  CURRENT_DATE - 5,  NULL,    NULL,    0,   'No procede, sin causa justificada',                        now() - INTERVAL '6 days',  now() - INTERVAL '5 days'),
    (12, 7, 2,    'approved', CURRENT_DATE - 2,  CURRENT_DATE + 1,  NULL,    NULL,    0,   'Nacimiento de hijo',                                       now() - INTERVAL '3 days',  now() - INTERVAL '2 days'),
    (8,  8, 2,    'approved', CURRENT_DATE - 7,  CURRENT_DATE - 4,  NULL,    NULL,    0,   'Fallecimiento de familiar directo',                        now() - INTERVAL '7 days',  now() - INTERVAL '7 days'),
    (10, 5, 2,    'rejected', CURRENT_DATE + 5,  CURRENT_DATE + 9,  NULL,    NULL,    0,   'Sin antiguedad suficiente: no ha cumplido su primer anio', now(),                      now())
  `);

  await knex('notices')
    .whereIn('reason_id', [3, 4, 7, 8])
    .update({
      kind: 'notice',
      approved_by: knex.raw('COALESCE(approved_by, 2)'),
      created_by: knex.raw('COALESCE(approved_by, 2)'),
      approved_at: knex.raw('COALESCE(approved_at, request_date)'),
    });

  const seededNotices = await knex('notices as n')
    .join('employees as e', 'e.employee_id', 'n.employee_id')
    .select(
      'n.notice_id',
      'e.shift_id',
      'n.absence_start_time',
      'n.absence_end_time',
      knex.raw("to_char(n.absence_start_date, 'YYYY-MM-DD') AS start_date"),
      knex.raw("to_char(n.absence_end_date, 'YYYY-MM-DD') AS end_date")
    );
  const schedules = await knex('shift_schedules').select('shift_id', 'day_of_week', 'is_working_day', 'check_in_time', 'check_out_time');

  for (const notice of seededNotices) {
    const breakdown = computeRequestBreakdown({
      schedule: schedules.filter((day) => day.shift_id === notice.shift_id),
      startDate: notice.start_date,
      endDate: notice.end_date,
      startTime: notice.absence_start_time,
      endTime: notice.absence_end_time,
    });
    await knex('notices')
      .where('notice_id', notice.notice_id)
      .update({ days_taken: breakdown.fullDays, hours_taken: breakdown.partialHours });
  }

  await knex.raw(`
    UPDATE notices n
    SET entitlement_id = ve.entitlement_id
    FROM vacation_entitlements ve, reasons r
    WHERE ve.employee_id = n.employee_id
      AND r.reason_id = n.reason_id
      AND r.affects_vacation_balance
      AND n.status = 'approved'
      AND n.absence_start_date BETWEEN ve.period_start AND ve.period_end
  `);
  await knex.raw(`
    UPDATE vacation_entitlements ve
    SET used_days = used.days, used_hours = used.hours
    FROM (
      SELECT entitlement_id, SUM(days_taken) AS days, SUM(hours_taken) AS hours
      FROM notices
      WHERE entitlement_id IS NOT NULL
      GROUP BY entitlement_id
    ) used
    WHERE ve.entitlement_id = used.entitlement_id
  `);
};
