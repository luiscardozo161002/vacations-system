import { useState } from 'react';
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
  const selectedLabel = options.find((option) => option.value === value)?.label ?? '';

  const handleChange = (text: string) => {
    const match = options.find((option) => option.label === text);
    if (match) {
      setTyped(null);
      onChange(match.value);
    } else if (text === '') {
      setTyped(null);
      onChange('');
    } else {
      setTyped(text);
    }
  };

  return (
    <>
      <SearchBox
        wrapperClassName={fullWidth ? 'w-full' : undefined}
        id={id}
        list={`${id}-list`}
        aria-label={placeholder}
        placeholder={placeholder}
        value={typed ?? selectedLabel}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => setTyped(null)}
        autoComplete="off"
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy}
      />
      <datalist id={`${id}-list`}>
        {options.map((option) => (
          <option key={option.value} value={option.label} />
        ))}
      </datalist>
    </>
  );
}
