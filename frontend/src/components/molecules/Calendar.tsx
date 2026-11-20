import { useMemo } from 'react';
import { cn } from '../../utils/cn';
import { MONTH_NAMES, WEEKDAYS, formatLongDate, monthCells, shiftMonth } from '../../utils/calendar';
import { todayIso } from '../../utils/format';
import { Icon } from '../atoms/Icon';
import { IconButton } from '../atoms/IconButton';
import { Select } from '../atoms/Select';

interface CalendarProps {
  month: string;
  onMonthChange: (month: string) => void;
  start?: string;
  end?: string;
  min?: string;
  max?: string;
  isRestDay?: (date: string) => boolean;
  onPick: (date: string) => void;
}

const YEARS_BEFORE = 60;
const YEARS_AFTER = 5;

export function Calendar({ month, onMonthChange, start, end, min, max, isRestDay, onPick }: CalendarProps) {
  const [year, monthNumber] = month.split('-').map(Number);
  const today = todayIso();
  const cells = useMemo(() => monthCells(year, monthNumber - 1), [year, monthNumber]);

  const firstYear = min ? Number(min.slice(0, 4)) : Number(today.slice(0, 4)) - YEARS_BEFORE;
  const lastYear = max ? Number(max.slice(0, 4)) : Number(today.slice(0, 4)) + YEARS_AFTER;
  const years = Array.from({ length: Math.max(lastYear, year) - Math.min(firstYear, year) + 1 }, (_, index) =>
    String(Math.min(firstYear, year) + index),
  );

  const disabled = (date: string) => (min !== undefined && date < min) || (max !== undefined && date > max);

  return (
    <div className="w-[17.5rem]">
      <div className="mb-3 flex items-center gap-1.5">
        <IconButton title="Mes anterior" className="size-8" onClick={() => onMonthChange(shiftMonth(month, -1))}>
          <Icon name="chevron-left" />
        </IconButton>
        <Select
          aria-label="Mes"
          className="h-8 px-2"
          value={String(monthNumber - 1)}
          options={MONTH_NAMES.map((name, index) => ({ value: String(index), label: name }))}
          onChange={(value) => onMonthChange(`${year}-${String(Number(value) + 1).padStart(2, '0')}`)}
        />
        <Select
          aria-label="Año"
          className="h-8 w-24 px-2"
          value={String(year)}
          options={years.map((item) => ({ value: item, label: item }))}
          onChange={(value) => onMonthChange(`${value}-${String(monthNumber).padStart(2, '0')}`)}
        />
        <IconButton title="Mes siguiente" className="size-8" onClick={() => onMonthChange(shiftMonth(month, 1))}>
          <Icon name="chevron-right" />
        </IconButton>
      </div>
      <div className="grid grid-cols-7 gap-y-0.5 text-center">
        {WEEKDAYS.map((weekday) => (
          <span key={weekday} className="py-1 text-xs font-medium text-muted">
            {weekday}
          </span>
        ))}
        {cells.map((cell) => {
          const isEdge = cell.date === start || cell.date === (end ?? start);
          const inRange = start !== undefined && end !== undefined && cell.date > start && cell.date < end;
          const rest = cell.inMonth && !isEdge && Boolean(isRestDay?.(cell.date));
          return (
            <button
              key={cell.date}
              type="button"
              disabled={!cell.inMonth || disabled(cell.date) || rest}
              aria-pressed={cell.inMonth ? isEdge : undefined}
              aria-label={cell.inMonth ? formatLongDate(cell.date) : undefined}
              onClick={() => onPick(cell.date)}
              className={cn(
                'mx-auto flex size-9 cursor-pointer items-center justify-center rounded-md text-sm text-fg',
                cell.inMonth ? 'hover:bg-subtle' : 'invisible',
                inRange && 'w-full rounded-none bg-line hover:bg-line',
                rest && 'cursor-not-allowed bg-danger text-danger-fg hover:bg-danger',
                rest && inRange && 'w-full rounded-none',
                cell.date === today && !isEdge && 'ring-1 ring-fg ring-inset',
                isEdge && 'bg-primary font-semibold text-primary-fg hover:bg-primary',
                disabled(cell.date) && 'cursor-not-allowed text-faint hover:bg-transparent',
              )}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
