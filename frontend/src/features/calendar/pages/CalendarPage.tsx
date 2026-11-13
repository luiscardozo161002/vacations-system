import { useMemo } from 'react';
import type { Calendar, CalendarAbsence, Holiday } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { useApiQuery } from '../../../lib/use-api-query';
import { useUrlFilters } from '../../../lib/use-url-filters';
import { todayIso } from '../../../lib/format';
import { Icon } from '../../../components/Icon';

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
      <div className="page-header">
        <div>
          <h1>Calendario de vacaciones</h1>
          <p className="page-sub">Vista mensual de ausencias aprobadas y pendientes.</p>
        </div>
      </div>
      {error && <p className="field-error">{error}</p>}
      <div className="card">
        <div className="calendar-head">
          <h3 className="section-title">
            {MONTH_NAMES[view.month]} {view.year}
          </h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={goToday}>
              Hoy
            </button>
            <button type="button" className="icon-btn" title="Mes anterior" onClick={() => moveMonth(-1)}>
              <Icon name="chevron-left" />
            </button>
            <button type="button" className="icon-btn" title="Mes siguiente" onClick={() => moveMonth(1)}>
              <Icon name="chevron-right" />
            </button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <div className="calendar-grid">
            {WEEKDAYS.map((weekday) => (
              <div key={weekday} className="weekday">
                {weekday}
              </div>
            ))}
            {cells.map((cell) => {
              const holiday = cell.inMonth ? holidays.get(cell.date) : undefined;
              const entries = cell.inMonth ? (absences.get(cell.date) ?? []) : [];
              return (
                <div
                  key={cell.date}
                  className={`day ${cell.inMonth ? '' : 'muted'} ${cell.date === today ? 'today' : ''}`}
                >
                  <span className="day-num">{cell.day}</span>
                  {holiday && (
                    <span className="day-pill" title={`${holiday.name} — descanso obligatorio`}>
                      {holiday.name}
                    </span>
                  )}
                  {entries.map((absence) => (
                    <span
                      key={absence.notice_id}
                      className={`day-pill ${absence.status}`}
                      title={`${absence.employee_name} — ${absence.reason_description}`}
                    >
                      {absence.employee_name.split(' ')[0]}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
