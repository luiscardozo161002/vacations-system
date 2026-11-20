import { useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '../../utils/cn';
import { formatNumericDate, isoWeekday, monthOf, toIso } from '../../utils/calendar';
import { control } from '../atoms/control';
import { Icon } from '../atoms/Icon';
import { Calendar } from './Calendar';

interface DatePickerProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  workingWeekdays?: number[];
  placeholder?: string;
  invalid?: boolean;
  describedBy?: string;
}

const clamp = (date: string, min?: string, max?: string) => {
  if (max !== undefined && date > max) return max;
  if (min !== undefined && date < min) return min;
  return date;
};

export function DatePicker({
  id,
  value,
  onChange,
  min,
  max,
  workingWeekdays,
  placeholder = 'dd/mm/aaaa',
  invalid,
  describedBy,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => monthOf(value || clamp(toIso(new Date()), min, max)));

  const changeOpen = (opening: boolean) => {
    if (opening) setMonth(monthOf(value || clamp(toIso(new Date()), min, max)));
    setOpen(opening);
  };

  const pick = (date: string) => {
    onChange(date);
    setOpen(false);
  };

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
          <span className={cn(!value && 'text-muted')}>{value ? formatNumericDate(value) : placeholder}</span>
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
          <Calendar
            month={month}
            onMonthChange={setMonth}
            start={value || undefined}
            min={min}
            max={max}
            isRestDay={workingWeekdays ? (date) => !workingWeekdays.includes(isoWeekday(date)) : undefined}
            onPick={pick}
          />
          {workingWeekdays && <p className="mt-2 text-xs text-muted">Los días en rojo son descanso del turno.</p>}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
