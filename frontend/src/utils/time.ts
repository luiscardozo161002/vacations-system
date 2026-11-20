export interface TimeRange {
  start: string;
  end: string;
}

export const HOUR = 60;

export const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * HOUR + minutes;
};

export const toClock = (minutes: number) =>
  `${String(Math.floor(minutes / HOUR)).padStart(2, '0')}:${String(minutes % HOUR).padStart(2, '0')}`;

export const formatHours = (minutes: number) => `${Number((minutes / HOUR).toFixed(2))} h`;

export const hourMarks = ({ start, end }: TimeRange, step = HOUR) => {
  const last = toMinutes(end);
  const marks: number[] = [];
  for (let minutes = toMinutes(start); minutes < last; minutes += step) marks.push(minutes);
  return [...marks, last].map(toClock);
};

export const fitsWithin = (range: TimeRange, limits: TimeRange) =>
  range.start >= limits.start && range.end <= limits.end && range.start < range.end;

export const firstHour = (limits: TimeRange): TimeRange => ({
  start: limits.start,
  end: toClock(Math.min(toMinutes(limits.start) + HOUR, toMinutes(limits.end))),
});
