import type { ReactNode } from 'react';

interface ListRowProps {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
}

export function ListRow({ leading, title, subtitle, meta }: ListRowProps) {
  return (
    <div className="flex items-center gap-3 border-b border-line py-2.5 last:border-b-0">
      {leading}
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-medium">{title}</div>
        {subtitle && <div className="text-[12.5px] text-muted">{subtitle}</div>}
      </div>
      {meta && (
        <div className="text-right text-[12.5px] whitespace-nowrap text-muted [&_strong]:block [&_strong]:text-sm [&_strong]:text-fg">
          {meta}
        </div>
      )}
    </div>
  );
}
