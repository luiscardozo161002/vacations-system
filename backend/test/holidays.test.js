const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { holidaysOfYear, holidaysBetween } = require('../src/lib/holidays');
const { computeRequestBreakdown } = require('../src/lib/request-breakdown');

const dates = (year) => holidaysOfYear(year).map((holiday) => holiday.date);

const OPERACIONES = [1, 2, 3, 4, 5, 6, 7].map((day) => ({
  day_of_week: day,
  is_working_day: day <= 6,
  check_in_time: day === 6 ? '08:00' : day < 6 ? '07:00' : null,
  check_out_time: day === 6 ? '13:00' : day < 6 ? '15:00' : null,
}));

describe('holidaysOfYear', () => {
  it('calcula los descansos obligatorios del Art. 74 de 2025', () => {
    assert.deepEqual(dates(2025), [
      '2025-01-01',
      '2025-02-03',
      '2025-03-17',
      '2025-05-01',
      '2025-09-16',
      '2025-11-17',
      '2025-12-25',
    ]);
  });

  it('los lunes movibles caen bien en 2026', () => {
    assert.deepEqual(dates(2026).slice(1, 3), ['2026-02-02', '2026-03-16']);
    assert.ok(dates(2026).includes('2026-11-16'));
  });

  it('el 1 de octubre solo cuenta cada seis años desde 2024', () => {
    assert.ok(dates(2024).includes('2024-10-01'));
    assert.ok(dates(2030).includes('2030-10-01'));
    assert.ok(!dates(2026).includes('2026-10-01'));
  });

  it('holidaysBetween abarca varios años', () => {
    assert.deepEqual(
      holidaysBetween('2025-12-20', '2026-01-05').map((holiday) => holiday.date),
      ['2025-12-25', '2026-01-01']
    );
  });
});

describe('festivos en el cálculo de una solicitud', () => {
  it('el ejemplo de RH: 16 oct a 19 dic 2025 en turno lunes a sábado son 55 días', () => {
    const result = computeRequestBreakdown({
      schedule: OPERACIONES,
      startDate: '2025-10-16',
      endDate: '2025-12-19',
      holidays: dates(2025),
    });

    assert.equal(result.fullDays, 55);
    assert.equal(result.holidayDays, 1);
  });

  it('un festivo que cae en día de descanso cuenta como descanso, no como festivo', () => {
    const result = computeRequestBreakdown({
      schedule: OPERACIONES,
      startDate: '2025-12-21',
      endDate: '2025-12-21',
      holidays: ['2025-12-21'],
    });

    assert.deepEqual([result.restDays, result.holidayDays], [1, 0]);
  });
});
