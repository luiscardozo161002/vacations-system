import { useState } from 'react';
import { Icon } from './Icon';

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
}

export function SearchSelect({ id, options, value, onChange, placeholder = 'Buscar...', fullWidth = false }: SearchSelectProps) {
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
      <div className="search-box" style={fullWidth ? { display: 'flex', width: '100%' } : undefined}>
        <Icon name="search" />
        <input
          type="text"
          id={id}
          list={`${id}-list`}
          placeholder={placeholder}
          value={typed ?? selectedLabel}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={() => setTyped(null)}
          autoComplete="off"
        />
      </div>
      <datalist id={`${id}-list`}>
        {options.map((option) => (
          <option key={option.value} value={option.label} />
        ))}
      </datalist>
    </>
  );
}
