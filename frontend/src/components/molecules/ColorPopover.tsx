import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '../../utils/cn';
import { Icon } from '../atoms/Icon';

interface ColorPopoverProps {
  label: string;
  value: string | null;
  colors: string[];
  onPick: (color: string | null) => void;
}

export function ColorPopover({ label, value, colors, onPick }: ColorPopoverProps) {
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          title={label}
          aria-label={label}
          className="flex size-8 cursor-pointer items-center justify-center rounded-md border border-line bg-surface hover:bg-subtle"
        >
          <span className="size-4 rounded-full border border-line" style={{ background: value ?? 'transparent' }} />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={6}
          collisionPadding={12}
          className="z-[60] w-[13.5rem] rounded-md border border-line bg-surface p-3 shadow-md focus:outline-none"
        >
          <p className="mb-2 text-xs font-semibold text-muted">{label}</p>
          <div className="grid grid-cols-5 gap-2">
            {colors.map((color) => (
              <PopoverPrimitive.Close asChild key={color}>
                <button
                  type="button"
                  title={color}
                  aria-label={color}
                  aria-pressed={color === value}
                  style={{ background: color }}
                  onClick={() => onPick(color)}
                  className={cn(
                    'size-7 cursor-pointer rounded-md border border-line hover:scale-105',
                    color === value && 'border-2 border-fg',
                  )}
                />
              </PopoverPrimitive.Close>
            ))}
          </div>
          <PopoverPrimitive.Close asChild>
            <button
              type="button"
              onClick={() => onPick(null)}
              className="mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-line px-2 py-1.5 text-xs text-muted hover:bg-subtle"
            >
              <Icon name="x" /> Quitar color
            </button>
          </PopoverPrimitive.Close>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
