import { cn } from '../../utils/cn';

interface ProgressBarProps {
  percent: number;
  className?: string;
}

export function ProgressBar({ percent, className }: ProgressBarProps) {
  const value = Math.min(100, Math.max(0, percent));

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-subtle', className)}
    >
      <div className="h-full rounded-full bg-fg" style={{ width: `${value}%` }} />
    </div>
  );
}
