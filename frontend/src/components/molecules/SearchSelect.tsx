import { useEffect, useState } from 'react';
import { config } from '../../config';
import { cn } from '../../utils/cn';
import { DropdownEmpty, DropdownPanel } from './DropdownPanel';
import { SearchBox } from './SearchBox';

export interface SearchSelectOption {
  value: string;
  label: string;
}

interface SearchSelectProps {
  id: string;
  options: SearchSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  fullWidth?: boolean;
  invalid?: boolean;
  describedBy?: string;
}

const MAX_VISIBLE = 50;

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

const matching = (options: SearchSelectOption[], text: string) => {
  const needle = normalize(text);
  return options.filter((option) => normalize(option.label).includes(needle)).slice(0, MAX_VISIBLE);
};

export function SearchSelect({
  id,
  options,
  value,
  onChange,
  placeholder = 'Buscar...',
  fullWidth = false,
  invalid,
  describedBy,
}: SearchSelectProps) {
  const [typed, setTyped] = useState<string | null>(null);
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = `${id}-list`;
  const selectedLabel = options.find((option) => option.value === value)?.label ?? '';
  const visible = matching(options, typed === null ? '' : term);

  useEffect(() => {
    if (typed === null) return;
    const timer = setTimeout(() => {
      setTerm(typed);
      setActive(0);
    }, config.searchDelayMs);
    return () => clearTimeout(timer);
  }, [typed]);

  const close = () => {
    setOpen(false);
    setTyped(null);
    setTerm('');
    setActive(0);
  };

  const pick = (option: SearchSelectOption) => {
    onChange(option.value);
    close();
  };

  const change = (text: string) => {
    setTyped(text);
    setOpen(true);
    if (text === '') onChange('');
  };

  const handleKeyDown = (key: string) => {
    if (key === 'ArrowDown') {
      setOpen(true);
      setActive((index) => Math.min(index + 1, visible.length - 1));
    } else if (key === 'ArrowUp') {
      setActive((index) => Math.max(index - 1, 0));
    } else if (key === 'Enter' && open && visible[active]) {
      pick(visible[active]);
    } else if (key === 'Escape') {
      close();
    }
  };

  return (
    <SearchBox
      wrapperClassName={fullWidth ? 'w-full' : undefined}
      id={id}
      role="combobox"
      aria-expanded={open}
      aria-controls={listId}
      aria-autocomplete="list"
      aria-activedescendant={open && visible[active] ? `${id}-option-${active}` : undefined}
      aria-label={placeholder}
      placeholder={placeholder}
      value={typed ?? selectedLabel}
      onChange={(e) => change(e.target.value)}
      onFocus={() => setOpen(true)}
      onClick={() => setOpen(true)}
      onBlur={close}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && open) e.preventDefault();
        handleKeyDown(e.key);
      }}
      autoComplete="off"
      aria-invalid={invalid ? true : undefined}
      aria-describedby={describedBy}
    >
      <DropdownPanel id={listId} role="listbox" className="left-0 w-full" hidden={!open}>
        {visible.length ? (
          visible.map((option, index) => (
            <div
              key={option.value}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={option.value === value}
              className={cn(
                'cursor-pointer px-3.5 py-2 text-sm text-fg hover:bg-subtle',
                index === active && 'bg-subtle',
                option.value === value && 'font-semibold',
              )}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(option)}
            >
              {option.label}
            </div>
          ))
        ) : (
          <DropdownEmpty>Sin resultados.</DropdownEmpty>
        )}
      </DropdownPanel>
    </SearchBox>
  );
}
