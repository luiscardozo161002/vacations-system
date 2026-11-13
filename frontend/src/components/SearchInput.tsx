import { useEffect, useEffectEvent, useState } from 'react';
import { Icon } from './Icon';

const SEARCH_DELAY_MS = 300;

interface SearchInputProps {
  value: string;
  onSearch: (value: string) => void;
  placeholder: string;
  id?: string;
}

export function SearchInput({ value, onSearch, placeholder, id }: SearchInputProps) {
  const [text, setText] = useState(value);
  const search = useEffectEvent(onSearch);

  useEffect(() => {
    const trimmed = text.trim();
    if (trimmed === value) return;
    const timer = setTimeout(() => search(trimmed), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [text, value]);

  return (
    <div className="search-box" style={{ display: 'flex' }}>
      <Icon name="search" />
      <input type="text" id={id} placeholder={placeholder} value={text} onChange={(e) => setText(e.target.value)} />
    </div>
  );
}
