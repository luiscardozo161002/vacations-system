import { describe, expect, it } from 'vitest';
import type { ShiftScheduleDay } from '@vacations/sdk';
import { formatBlocks, toBlocks, toSchedule } from './schedule-blocks';

const day = (day_of_week: ShiftScheduleDay['day_of_week'], check_in_time: string | null, check_out_time: string | null) => ({
  day_of_week,
  is_working_day: Boolean(check_in_time),
  check_in_time,
  check_out_time,
});

describe('bloques de horario', () => {
  const schedule = [
    day(1, '07:00:00', '15:00:00'),
    day(2, '07:00:00', '15:00:00'),
    day(3, '07:00:00', '15:00:00'),
    day(4, '07:00:00', '15:00:00'),
    day(5, '07:00:00', '15:00:00'),
    day(6, '08:00:00', '13:00:00'),
    day(7, null, null),
  ];

  it('agrupa los días con el mismo horario y los resume', () => {
    expect(formatBlocks(toBlocks(schedule))).toBe('Lun-Vie 07:00–15:00; Sáb 08:00–13:00');
  });

  it('vuelve a armar la semana completa', () => {
    const week = toSchedule(toBlocks(schedule));
    expect(week).toHaveLength(7);
    expect(week[6]).toEqual({ day_of_week: 7, is_working_day: false, check_in_time: null, check_out_time: null });
    expect(week[5].check_in_time).toBe('08:00');
  });
});
