import type { DayOfWeek, ShiftScheduleDay } from '@vacations/sdk';

export interface ScheduleBlock {
  days: DayOfWeek[];
  start: string;
  end: string;
}

export const WEEK: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 7];
export const DAY_LETTERS: Record<DayOfWeek, string> = { 1: 'L', 2: 'M', 3: 'M', 4: 'J', 5: 'V', 6: 'S', 7: 'D' };
const DAY_SHORT: Record<DayOfWeek, string> = { 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb', 7: 'Dom' };

const shortTime = (time: string) => time.slice(0, 5);

export const toBlocks = (schedule: ShiftScheduleDay[]): ScheduleBlock[] => {
  const blocks = new Map<string, ScheduleBlock>();
  [...schedule]
    .sort((a, b) => a.day_of_week - b.day_of_week)
    .filter((day) => day.is_working_day && day.check_in_time && day.check_out_time)
    .forEach((day) => {
      const start = shortTime(day.check_in_time ?? '');
      const end = shortTime(day.check_out_time ?? '');
      const key = `${start}-${end}`;
      const block = blocks.get(key) ?? { days: [], start, end };
      block.days.push(day.day_of_week);
      blocks.set(key, block);
    });
  return [...blocks.values()];
};

export const toSchedule = (blocks: ScheduleBlock[]): ShiftScheduleDay[] =>
  WEEK.map((day) => {
    const block = blocks.find((item) => item.days.includes(day));
    return {
      day_of_week: day,
      is_working_day: Boolean(block),
      check_in_time: block ? block.start : null,
      check_out_time: block ? block.end : null,
    };
  });

const formatDays = (days: DayOfWeek[]): string => {
  const sorted = [...days].sort((a, b) => a - b);
  const ranges: string[] = [];
  let first = sorted[0];
  let previous = sorted[0];
  sorted.slice(1).forEach((day) => {
    if (day === previous + 1) {
      previous = day;
      return;
    }
    ranges.push(first === previous ? DAY_SHORT[first] : `${DAY_SHORT[first]}-${DAY_SHORT[previous]}`);
    first = day;
    previous = day;
  });
  ranges.push(first === previous ? DAY_SHORT[first] : `${DAY_SHORT[first]}-${DAY_SHORT[previous]}`);
  return ranges.join(', ');
};

export const formatBlocks = (blocks: ScheduleBlock[]): string =>
  blocks.map((block) => `${formatDays(block.days)} ${block.start}–${block.end}`).join('; ');
