import * as SelectPrimitive from '@radix-ui/react-select';
import { cn } from '../../utils/cn';
import { Icon } from './Icon';

export interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  compact?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

const EMPTY = '__empty__';

const encode = (value: string) => (value === '' ? EMPTY : value);
const decode = (value: string) => (value === EMPTY ? '' : value);

export function Select({ id, value, onChange, options, placeholder, compact = false, required, disabled, className, ...aria }: SelectProps) {
  const hasEmptyOption = options.some((option) => option.value === '');

  return (
    <SelectPrimitive.Root
      value={value === '' && !hasEmptyOption ? '' : encode(value)}
      onValueChange={(next) => onChange(decode(next))}
      required={required}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        id={id}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-sm border border-line bg-surface text-left text-base text-fg focus:border-fg focus:shadow-[0_0_0_3px_var(--focus-ring)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 data-[placeholder]:text-muted',
          compact ? 'h-9 w-auto px-2.5' : 'h-[38px] px-3',
          className,
        )}
        {...aria}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon className="text-muted">
          <Icon name="chevron-down" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className="z-[70] max-h-[var(--radix-select-content-available-height)] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-line bg-surface shadow-md"
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={encode(String(option.value))}
                className="flex cursor-pointer items-center rounded-sm px-2.5 py-2 text-sm text-fg outline-none select-none data-[highlighted]:bg-subtle data-[state=checked]:font-medium"
              >
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
