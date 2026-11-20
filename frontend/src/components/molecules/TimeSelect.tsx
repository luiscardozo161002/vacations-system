import { useMemo } from 'react';
import { Select } from '../atoms/Select';

interface TimeSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  step?: number;
  disabled?: boolean;
  'aria-label'?: string;
}

const MINUTES_PER_DAY = 1440;

const toTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export function TimeSelect({ id, value, onChange, step = 30, disabled, ...aria }: TimeSelectProps) {
  const time = value.slice(0, 5);
  const options = useMemo(() => {
    const times = Array.from({ length: MINUTES_PER_DAY / step }, (_, index) => toTime(index * step));
    return (time && !times.includes(time) ? [...times, time].sort() : times).map((item) => ({ value: item, label: item }));
  }, [step, time]);

  return <Select id={id} value={time} options={options} onChange={onChange} disabled={disabled} {...aria} />;
}
