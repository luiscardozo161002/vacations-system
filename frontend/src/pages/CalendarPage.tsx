import { useMemo } from 'react';
import type { Calendar, CalendarAbsence, Holiday } from '@vacations/sdk';
import { sdk } from '../services/sdk';
import { useApiQuery } from '../hooks/use-api-query';
import { useUrlFilters } from '../hooks/use-url-filters';
import { todayIso } from '../utils/format';
import { Icon } from '../components/atoms/Icon';
import { PageHeader } from '../components/molecules/PageHeader';
import { Button } from '../components/atoms/Button';
import { IconButton } from '../components/atoms/IconButton';
import { Card, CardHeader, CardTitle } from '../components/molecules/Card';
import { FieldError } from '../components/atoms/FieldText';
import { cn } from '../utils/cn';
import { DayPill } from '../features/calendar/components/DayPill';

const MONTH_NAMES = [
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
const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const pad = (value: number) => String(value).padStart(2, '0');
const toIso = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

interface Cell {
  date: string;
  day: number;
  inMonth: boolean;
}

const monthCells = (year: number, month: number): Cell[] => {
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const total = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  return Array.from({ length: total }, (_, index) => {
    const date = new Date(year, month, index - firstWeekday + 1);
    return { date: toIso(date), day: date.getDate(), inMonth: date.getMonth() === month };
  });
};

const FILTERS = { mes: '' };

const currentMonth = () => toIso(new Date()).slice(0, 7);

const groupByDate = (calendar: Calendar | undefined) => {
  const absences = new Map<string, CalendarAbsence[]>();
  const holidays = new Map<string, Holiday>();
  if (!calendar) return { absences, holidays };

  calendar.holidays.forEach((holiday) => holidays.set(holiday.date, holiday));
  calendar.absences.forEach((absence) =>
    absence.dates.forEach((date) => absences.set(date, [...(absences.get(date) ?? []), absence])),
  );
  return { absences, holidays };
};

export function CalendarPage() {
  const [filters, setFilters] = useUrlFilters(FILTERS);
  const [year, monthNumber] = (filters.mes || currentMonth()).split('-').map(Number);
  const view = useMemo(() => ({ year, month: monthNumber - 1 }), [year, monthNumber]);

  const cells = useMemo(() => monthCells(view.year, view.month), [view]);
  const today = todayIso();

  const from = toIso(new Date(view.year, view.month, 1));
  const to = toIso(new Date(view.year, view.month + 1, 0));
  const { data: calendar, error } = useApiQuery(['calendar', from, to], (signal) => sdk.calendar.get({ from, to }, { signal }));

  const { absences, holidays } = useMemo(() => groupByDate(calendar), [calendar]);

  const moveMonth = (delta: number) => {
    const month = toIso(new Date(view.year, view.month + delta, 1)).slice(0, 7);
    setFilters({ mes: month === currentMonth() ? '' : month });
  };

  const goToday = () => setFilters({ mes: '' });

  return (
    <>
      <PageHeader title="Calendario de vacaciones" subtitle="Vista mensual de ausencias aprobadas y pendientes." />
      {error && <FieldError>{error}</FieldError>}
      <Card>
        <CardHeader>
          <CardTitle>
            {MONTH_NAMES[view.month]} {view.year}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={goToday}>
              Hoy
            </Button>
            <IconButton title="Mes anterior" onClick={() => moveMonth(-1)}>
              <Icon name="chevron-left" />
            </IconButton>
            <IconButton title="Mes siguiente" onClick={() => moveMonth(1)}>
              <Icon name="chevron-right" />
            </IconButton>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <div className="grid grid-cols-[repeat(7,minmax(120px,1fr))] border-t border-l border-line bg-surface">
            {WEEKDAYS.map((weekday) => (
              <div
                key={weekday}
                className="border-r border-b border-line bg-subtle px-2.5 py-2 text-[11.5px] font-semibold text-muted uppercase"
              >
                {weekday}
              </div>
            ))}
            {cells.map((cell) => {
              const holiday = cell.inMonth ? holidays.get(cell.date) : undefined;
              const entries = cell.inMonth ? (absences.get(cell.date) ?? []) : [];
              const isToday = cell.date === today;
              return (
                <div
                  key={cell.date}
                  className={cn(
                    'flex min-h-24 flex-col gap-1 border-r border-b border-line bg-surface p-2 text-[12.5px] text-muted',
                    !cell.inMonth && 'bg-subtle text-faint',
                    isToday && 'shadow-[inset_0_0_0_2px_var(--text)]',
                  )}
                >
                  <span className={cn('text-sm font-semibold text-fg', !cell.inMonth && 'text-faint')}>
                    {cell.day}
                  </span>
                  {holiday && (
                    <DayPill title={`${holiday.name} — descanso obligatorio`}>{holiday.name}</DayPill>
                  )}
                  {entries.map((absence) => (
                    <DayPill
                      key={absence.notice_id}
                      status={absence.status}
                      title={`${absence.employee_name} — ${absence.reason_description}`}
                    >
                      {absence.employee_name.split(' ')[0]}
                    </DayPill>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </>
  );
}
