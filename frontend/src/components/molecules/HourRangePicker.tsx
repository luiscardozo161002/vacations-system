import { useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '../../utils/cn';
import { formatHours, hourMarks, toMinutes, type TimeRange } from '../../utils/time';
import { Button } from '../atoms/Button';
import { control } from '../atoms/control';
import { Icon } from '../atoms/Icon';

interface HourRangePickerProps {
  id: string;
  value: TimeRange;
  workHours: TimeRange;
  onChange: (value: TimeRange) => void;
}

interface Draft {
  start: string;
  end: string | null;
}

const duration = ({ start, end }: Draft) => (end ? formatHours(toMinutes(end) - toMinutes(start)) : '—');

export function HourRangePicker({ id, value, workHours, onChange }: HourRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(value);
  const [anchor, setAnchor] = useState<string | null>(null);
  const marks = hourMarks(workHours);

  const changeOpen = (opening: boolean) => {
    if (opening) {
      setDraft(value);
      setAnchor(null);
    }
    setOpen(opening);
  };

  const pick = (mark: string) => {
    if (anchor === null) {
      setDraft({ start: mark, end: null });
      setAnchor(mark);
    } else if (mark !== anchor) {
      setDraft(mark < anchor ? { start: mark, end: anchor } : { start: anchor, end: mark });
      setAnchor(null);
    }
  };

  const accept = () => {
    if (draft.end) onChange({ start: draft.start, end: draft.end });
    setOpen(false);
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={changeOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          id={id}
          type="button"
          className={cn(control, 'flex h-[38px] cursor-pointer items-center justify-between gap-2 px-3 text-left')}
        >
          <span>
            {value.start} – {value.end}
            <span className="ml-2 text-muted">{duration(value)}</span>
          </span>
          <span className="text-muted">
            <Icon name="clock" />
          </span>
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className="z-[60] max-h-[var(--radix-popover-content-available-height)] w-72 overflow-y-auto rounded-md border border-line bg-surface p-3 shadow-md focus:outline-none"
        >
          <div className="mb-3 flex items-center justify-between rounded-md bg-subtle px-4 py-3 text-center">
            <div>
              <div className="text-xl font-semibold text-fg">{draft.start}</div>
              <div className="text-xs text-muted">Inicio</div>
            </div>
            <div className="text-sm font-medium text-muted">{duration(draft)}</div>
            <div>
              <div className="text-xl font-semibold text-fg">{draft.end ?? '--:--'}</div>
              <div className="text-xs text-muted">Fin</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {marks.map((mark) => {
              const edge = mark === draft.start || mark === draft.end;
              const between = draft.end !== null && mark > draft.start && mark < draft.end;
              return (
                <button
                  key={mark}
                  type="button"
                  aria-pressed={edge}
                  onClick={() => pick(mark)}
                  className={cn(
                    'h-10 cursor-pointer rounded-md bg-subtle text-sm font-medium text-fg hover:bg-line',
                    between && 'bg-line',
                    edge && 'bg-primary font-semibold text-primary-fg hover:bg-primary',
                  )}
                >
                  {mark}
                </button>
              );
            })}
          </div>
          <Button className="mt-3 w-full" disabled={draft.end === null} onClick={accept}>
            Aceptar
          </Button>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
