import { describe, expect, it } from 'vitest';
import { absenceDates, absenceHours, formatAbsenceRange, formatDaysHours, initial } from './format';

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

  it('un solo día se escribe una vez y las horas de un día no repiten la fecha', () => {
    const oneDay = { absence_start_date: '2026-11-26', absence_end_date: '2026-11-26', absence_start_time: null, absence_end_time: null };
    const hours = { ...oneDay, absence_start_time: '07:00:00', absence_end_time: '11:00:00' };

    expect(formatAbsenceRange(oneDay)).toBe(absenceDates(oneDay));
    expect(formatAbsenceRange(oneDay)).not.toContain('–');
    expect(formatAbsenceRange(hours)).toBe(`${absenceDates(hours)} · 07:00 – 11:00`);
    expect(absenceHours(hours)).toBe('07:00 – 11:00');
    expect(absenceHours(oneDay)).toBeNull();
  });
});

describe('initial', () => {
  it('toma solo la primera letra del nombre, en mayúscula', () => {
    expect(initial('Maria Garcia Hernandez')).toBe('M');
    expect(initial('  carlos ramirez')).toBe('C');
    expect(initial('')).toBe('');
  });
});
