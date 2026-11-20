export const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const DAY_MS = 86_400_000;

const pad = (value: number) => String(value).padStart(2, '0');

export const toIso = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const parseIso = (iso: string) => new Date(`${iso}T00:00:00`);

export const monthOf = (iso: string) => iso.slice(0, 7);

export const shiftMonth = (month: string, delta: number) => {
  const [year, number] = month.split('-').map(Number);
  return monthOf(toIso(new Date(year, number - 1 + delta, 1)));
};

export interface Cell {
  date: string;
  day: number;
  inMonth: boolean;
}

export const monthCells = (year: number, month: number): Cell[] => {
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const total = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  return Array.from({ length: total }, (_, index) => {
    const date = new Date(year, month, index - firstWeekday + 1);
    return { date: toIso(date), day: date.getDate(), inMonth: date.getMonth() === month };
  });
};

export const countDays = (start: string, end: string) =>
  Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / DAY_MS) + 1;

export const isoWeekday = (iso: string) => parseIso(iso).getDay() || 7;

export const nextWeekday = (iso: string) => {
  const date = parseIso(iso);
  while ((date.getDay() || 7) > 5) date.setDate(date.getDate() + 1);
  return toIso(date);
};

export const countWorkingDays = (start: string, end: string, workingWeekdays: number[]) => {
  let count = 0;
  for (const date = parseIso(start); toIso(date) <= end; date.setDate(date.getDate() + 1)) {
    if (workingWeekdays.includes(date.getDay() || 7)) count += 1;
  }
  return count;
};

const GOLDEN_ANGLE = 137.508;

export const personHue = (employeeId: number) => Math.round((employeeId * GOLDEN_ANGLE) % 360);

export const formatNumericDate = (iso: string) => iso.split('-').reverse().join('/');

export const formatWeekdayDate = (iso: string) => {
  const date = parseIso(iso);
  return `${WEEKDAYS[(date.getDay() + 6) % 7]} ${date.getDate()} ${MONTH_NAMES[date.getMonth()].slice(0, 3).toLowerCase()}`;
};

export const formatLongDate = (iso: string) => {
  const date = parseIso(iso);
  return `${date.getDate()} de ${MONTH_NAMES[date.getMonth()].toLowerCase()} de ${date.getFullYear()}`;
};

export const formatDayCount = (days: number) => `${days} día${days === 1 ? '' : 's'}`;
