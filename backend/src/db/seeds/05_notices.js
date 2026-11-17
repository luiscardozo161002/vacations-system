const { computeRequestBreakdown } = require('../../lib/request-breakdown');
const { resetSequence } = require('../seed-helpers');

const REASONS = [
  { reason_id: 1, description: 'Permiso Personal', requires_approval: true, affects_vacation_balance: false },
  { reason_id: 2, description: 'Castigo', requires_approval: true, affects_vacation_balance: false },
  { reason_id: 3, description: 'Onomástico', requires_approval: true, affects_vacation_balance: false },
  { reason_id: 4, description: 'Comisión De Trabajo', requires_approval: true, affects_vacation_balance: false },
  { reason_id: 5, description: 'Vacaciones', requires_approval: true, affects_vacation_balance: true },
  { reason_id: 6, description: 'Tiempo Por Tiempo', requires_approval: true, affects_vacation_balance: false },
  { reason_id: 7, description: 'Natalicio', requires_approval: true, affects_vacation_balance: false },
  { reason_id: 8, description: 'Deceso', requires_approval: true, affects_vacation_balance: false },
];

const NOTICE_REASON_IDS = [3, 4, 7, 8];

const INSERT_NOTICES = `
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
`;

const LINK_NOTICES_TO_ENTITLEMENTS = `
  UPDATE notices n
  SET entitlement_id = ve.entitlement_id
  FROM vacation_entitlements ve, reasons r
  WHERE ve.employee_id = n.employee_id
    AND r.reason_id = n.reason_id
    AND r.affects_vacation_balance
    AND n.status = 'approved'
    AND n.absence_start_date BETWEEN ve.period_start AND ve.period_end
`;

const SUM_USED_DAYS_PER_ENTITLEMENT = `
  UPDATE vacation_entitlements ve
  SET used_days = used.days, used_hours = used.hours
  FROM (
    SELECT entitlement_id, SUM(days_taken) AS days, SUM(hours_taken) AS hours
    FROM notices
    WHERE entitlement_id IS NOT NULL
    GROUP BY entitlement_id
  ) used
  WHERE ve.entitlement_id = used.entitlement_id
`;

const markAdministrativeNotices = (knex) =>
  knex('notices')
    .whereIn('reason_id', NOTICE_REASON_IDS)
    .update({
      kind: 'notice',
      approved_by: knex.raw('COALESCE(approved_by, 2)'),
      created_by: knex.raw('COALESCE(approved_by, 2)'),
      approved_at: knex.raw('COALESCE(approved_at, request_date)'),
    });

const fillTakenDays = async (knex) => {
  const notices = await knex('notices as n')
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

  for (const notice of notices) {
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
};

exports.seed = async function (knex) {
  await knex('reasons').insert(REASONS);
  await resetSequence(knex, 'reasons', 'reason_id');

  await knex.raw(INSERT_NOTICES);
  await markAdministrativeNotices(knex);
  await fillTakenDays(knex);

  await knex.raw(LINK_NOTICES_TO_ENTITLEMENTS);
  await knex.raw(SUM_USED_DAYS_PER_ENTITLEMENT);
};
