const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { computeRequestBreakdown } = require('../src/lib/request-breakdown');

const week = (days) =>
  [1, 2, 3, 4, 5, 6, 7].map((day) => {
    const hours = days[day];
    return {
      day_of_week: day,
      is_working_day: Boolean(hours),
      check_in_time: hours ? hours[0] : null,
      check_out_time: hours ? hours[1] : null,
    };
  });

const weekdays = (from, to) => ({ 1: [from, to], 2: [from, to], 3: [from, to], 4: [from, to], 5: [from, to] });

const OFICINAS = week(weekdays('07:00', '16:00'));
const OPERACIONES = week({ ...weekdays('07:00', '15:00'), 6: ['08:00', '13:00'] });

const MONDAY = '2026-11-09';
const TUESDAY = '2026-11-10';
const FRIDAY = '2026-11-13';
const SATURDAY = '2026-11-14';
const SUNDAY = '2026-11-15';
const NEXT_MONDAY = '2026-11-16';

const breakdown = (schedule, startDate, endDate, startTime, endTime) =>
  computeRequestBreakdown({ schedule, startDate, endDate, startTime, endTime });

describe('computeRequestBreakdown', () => {
  it('un día completo cuenta como 1 día', () => {
    assert.deepEqual(breakdown(OFICINAS, MONDAY, MONDAY), { fullDays: 1, partialHours: 0, restDays: 0, holidayDays: 0, dailyHours: 9 });
  });

  it('lunes a viernes completos son 5 días', () => {
    assert.equal(breakdown(OFICINAS, MONDAY, FRIDAY).fullDays, 5);
  });

  it('horas dentro del mismo día cuentan como horas parciales', () => {
    assert.deepEqual(breakdown(OFICINAS, MONDAY, MONDAY, '09:00', '13:00'), {
      fullDays: 0,
      partialHours: 4,
      restDays: 0,
      holidayDays: 0,
      dailyHours: 9,
    });
  });

  it('las horas fuera del turno no cuentan', () => {
    assert.equal(breakdown(OFICINAS, MONDAY, MONDAY, '05:00', '20:00').fullDays, 1);
    assert.deepEqual(breakdown(OFICINAS, MONDAY, MONDAY, '15:00', '18:00').partialHours, 1);
  });

  it('acepta horas con segundos como las devuelve Postgres', () => {
    assert.equal(breakdown(OFICINAS, MONDAY, MONDAY, '09:00:00', '13:30:00').partialHours, 4.5);
  });

  it('un rango que cruza el fin de semana no cuenta sábado ni domingo en Oficinas', () => {
    assert.deepEqual(breakdown(OFICINAS, FRIDAY, NEXT_MONDAY), { fullDays: 2, partialHours: 0, restDays: 2, holidayDays: 0, dailyHours: 9 });
  });

  it('un rango que solo cae en fin de semana no consume nada', () => {
    assert.deepEqual(breakdown(OFICINAS, SATURDAY, SUNDAY), { fullDays: 0, partialHours: 0, restDays: 2, holidayDays: 0, dailyHours: 9 });
  });

  it('en Operaciones el sábado corto completo cuenta como día', () => {
    assert.deepEqual(breakdown(OPERACIONES, SATURDAY, SATURDAY), { fullDays: 1, partialHours: 0, restDays: 0, holidayDays: 0, dailyHours: 8 });
  });

  it('en Operaciones una semana completa son 6 días y el domingo es descanso', () => {
    assert.deepEqual(breakdown(OPERACIONES, MONDAY, SUNDAY), { fullDays: 6, partialHours: 0, restDays: 1, holidayDays: 0, dailyHours: 8 });
  });

  it('en Operaciones de viernes 13:00 a sábado 13:00 son 1 día y 2 horas', () => {
    assert.deepEqual(breakdown(OPERACIONES, FRIDAY, SATURDAY, '13:00', '13:00'), {
      fullDays: 1,
      partialHours: 2,
      restDays: 0,
      holidayDays: 0,
      dailyHours: 8,
    });
  });

  it('las horas parciales de varios días se juntan en días completos', () => {
    assert.deepEqual(breakdown(OFICINAS, MONDAY, TUESDAY, '10:00', '14:00'), {
      fullDays: 1,
      partialHours: 4,
      restDays: 0,
      holidayDays: 0,
      dailyHours: 9,
    });
  });

  it('un turno sin días laborables usa 8 horas de referencia', () => {
    assert.deepEqual(breakdown(week({}), MONDAY, TUESDAY), { fullDays: 0, partialHours: 0, restDays: 2, holidayDays: 0, dailyHours: 8 });
  });
});
