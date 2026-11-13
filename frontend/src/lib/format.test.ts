import { describe, expect, it } from 'vitest';
import { formatAbsenceRange, formatDaysHours, initials } from './format';

describe('formatDaysHours', () => {
  it('junta días y horas con singular y plural', () => {
    expect(formatDaysHours(1, 0)).toBe('1 día');
    expect(formatDaysHours(3, 2)).toBe('3 días y 2 horas');
    expect(formatDaysHours(0, 1)).toBe('1 hora');
    expect(formatDaysHours(0, 0)).toBe('0 días');
  });
});

describe('formatAbsenceRange', () => {
  it('muestra el horario solo cuando la ausencia es por horas', () => {
    const days = { absence_start_date: '2026-11-02', absence_end_date: '2026-11-03', absence_start_time: null, absence_end_time: null };
    const hours = { ...days, absence_end_date: '2026-11-02', absence_start_time: '13:00:00', absence_end_time: '14:00:00' };

    expect(formatAbsenceRange(days)).not.toContain(':');
    expect(formatAbsenceRange(hours)).toContain('13:00');
    expect(formatAbsenceRange(hours)).toContain('14:00');
  });
});

describe('initials', () => {
  it('toma las dos primeras palabras', () => {
    expect(initials('Maria Garcia Hernandez')).toBe('MG');
  });
});
