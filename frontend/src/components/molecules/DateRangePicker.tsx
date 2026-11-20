import { useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '../../utils/cn';
import { countDays, countWorkingDays, formatDayCount, formatWeekdayDate, isoWeekday, monthOf } from '../../utils/calendar';
import { Button } from '../atoms/Button';
import { control } from '../atoms/control';
import { Icon } from '../atoms/Icon';
import { Calendar } from './Calendar';
import { CheckboxRow } from './CheckboxRow';

const SATURDAY = 6;

export interface DateRange {
  start: string;
  end: string;
  skipSaturdays: boolean;
}

interface DateRangePickerProps {
  id: string;
  value: DateRange;
  onChange: (value: DateRange) => void;
  min?: string;
  workingWeekdays?: number[];
  invalid?: boolean;
  describedBy?: string;
}

const rangeLabel = ({ start, end }: DateRange) =>
  start === end ? formatWeekdayDate(start) : `${formatWeekdayDate(start)} – ${formatWeekdayDate(end)}`;

export function DateRangePicker({ id, value, onChange, min, workingWeekdays, invalid, describedBy }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange>(value);
  const [anchor, setAnchor] = useState<string | null>(null);
  const [month, setMonth] = useState(() => monthOf(value.start));

  const changeOpen = (opening: boolean) => {
    if (opening) {
      setDraft(value);
      setAnchor(null);
      setMonth(monthOf(value.start));
    }
    setOpen(opening);
  };

  const pick = (date: string) => {
    if (anchor === null) {
      setDraft((prev) => ({ ...prev, start: date, end: date }));
      setAnchor(date);
    } else {
      setDraft((prev) => ({ ...prev, ...(date < anchor ? { start: date, end: anchor } : { start: anchor, end: date }) }));
      setAnchor(null);
    }
  };

  const coveredWeekdays = (skipSaturdays: boolean) =>
    skipSaturdays ? workingWeekdays?.filter((weekday) => weekday !== SATURDAY) : workingWeekdays;
  const saturdaysIn = ({ start, end }: DateRange) =>
    workingWeekdays?.includes(SATURDAY) ? countWorkingDays(start, end, [SATURDAY]) : 0;
  const keepsSkip = (range: DateRange) => range.skipSaturdays && saturdaysIn(range) > 0;

  const draftWeekdays = workingWeekdays?.includes(SATURDAY) ? coveredWeekdays(draft.skipSaturdays) : workingWeekdays;
  const isRestDay = draftWeekdays ? (date: string) => !draftWeekdays.includes(isoWeekday(date)) : undefined;
  const dayCount = (range: DateRange) => {
    const weekdays = coveredWeekdays(keepsSkip(range));
    const count = formatDayCount(weekdays ? countWorkingDays(range.start, range.end, weekdays) : countDays(range.start, range.end));
    return keepsSkip(range) ? `${count}, sin sábado` : count;
  };

  const accept = () => {
    onChange({ ...draft, skipSaturdays: keepsSkip(draft) });
    setOpen(false);
  };

  const worksSaturdays = Boolean(workingWeekdays?.includes(SATURDAY));

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={changeOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          id={id}
          type="button"
          aria-invalid={invalid ? true : undefined}
          aria-describedby={describedBy}
          className={cn(control, 'flex h-[38px] cursor-pointer items-center justify-between gap-2 px-3 text-left')}
        >
          <span>
            {rangeLabel(value)}
            <span className="ml-2 text-muted">{dayCount(value)}</span>
          </span>
          <span className="text-muted">
            <Icon name="calendar" />
          </span>
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className="z-[60] max-h-[var(--radix-popover-content-available-height)] overflow-y-auto rounded-md border border-line bg-surface p-3 shadow-md focus:outline-none"
        >
          <div className="mb-3 flex items-center justify-between rounded-md bg-subtle px-3 py-2.5 text-sm font-semibold text-fg">
            <span>{formatWeekdayDate(draft.start)}</span>
            <span className="text-xs font-medium text-muted">{dayCount(draft)}</span>
            <span>{formatWeekdayDate(draft.end)}</span>
          </div>
          <Calendar
            month={month}
            onMonthChange={setMonth}
            start={draft.start}
            end={draft.end}
            min={min}
            isRestDay={isRestDay}
            onPick={pick}
          />
          {isRestDay && <p className="mt-2 text-xs text-muted">Los días en rojo son descanso del turno y no se cuentan.</p>}
          {worksSaturdays && (
            <CheckboxRow
              className="mt-3"
              checked={!draft.skipSaturdays}
              onCheckedChange={(checked) => setDraft((prev) => ({ ...prev, skipSaturdays: checked !== true }))}
            >
              Habilitar día sábado para este empleado
            </CheckboxRow>
          )}
          <Button className="mt-3 w-full" onClick={accept}>
            Aceptar
          </Button>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
