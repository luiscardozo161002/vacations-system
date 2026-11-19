import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  children?: ReactNode;
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-fg">{title}</h1>
        <p className="mt-1 text-[13.5px] text-muted">{subtitle}</p>
      </div>
      {children && <div className="flex flex-wrap gap-2.5">{children}</div>}
    </div>
  );
}
