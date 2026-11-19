import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: ReactNode;
  subtitle: ReactNode;
  children?: ReactNode;
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        <p className="page-sub">{subtitle}</p>
      </div>
      {children && <div className="page-actions">{children}</div>}
    </div>
  );
}
