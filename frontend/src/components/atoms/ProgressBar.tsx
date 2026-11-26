import { cn } from '../../utils/cn';

interface ProgressBarProps {
  percent: number;
  color?: string | null;
  className?: string;
}

export function ProgressBar({ percent, color, className }: ProgressBarProps) {
  const value = Math.min(100, Math.max(0, percent));

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-subtle', className)}
    >
      <div className={cn('h-full rounded-full', !color && 'bg-fg')} style={{ width: `${value}%`, background: color ?? undefined }} />
    </div>
  );
}
