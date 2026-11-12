import { useEffect, useMemo, useState } from 'react';
import type { Calendar, CalendarAbsence, Holiday } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { getErrorMessage } from '../../../lib/get-error-message';
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

const groupByDate = (calendar: Calendar | null) => {
  const absences = new Map<string, CalendarAbsence[]>();
  const holidays = new Map<string, Holiday>();
  if (!calendar) return { absences, holidays };

  calendar.holidays.forEach((holiday) => holidays.set(holiday.date, holiday));
  calendar.absences.forEach((absence) => {
    const day = new Date(`${absence.absence_start_date < calendar.from ? calendar.from : absence.absence_start_date}T00:00:00`);
    const last = absence.absence_end_date > calendar.to ? calendar.to : absence.absence_end_date;
    for (; toIso(day) <= last; day.setDate(day.getDate() + 1)) {
      const date = toIso(day);
      absences.set(date, [...(absences.get(date) ?? []), absence]);
    }
  });
  return { absences, holidays };
};

export function CalendarPage() {
  const [view, setView] = useState(() => ({ year: new Date().getFullYear(), month: new Date().getMonth() }));
  const [calendar, setCalendar] = useState<Calendar | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cells = useMemo(() => monthCells(view.year, view.month), [view]);
  const today = todayIso();

  useEffect(() => {
    const controller = new AbortController();
    const from = toIso(new Date(view.year, view.month, 1));
    const to = toIso(new Date(view.year, view.month + 1, 0));

    sdk.calendar
      .get({ from, to }, { signal: controller.signal })
      .then((result) => {
        setCalendar(result);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setError(getErrorMessage(err));
      });

    return () => controller.abort();
  }, [view]);

  const { absences, holidays } = useMemo(() => groupByDate(calendar), [calendar]);

  const moveMonth = (delta: number) =>
    setView(({ year, month }) => {
      const date = new Date(year, month + delta, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });

  const goToday = () => setView({ year: new Date().getFullYear(), month: new Date().getMonth() });

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
