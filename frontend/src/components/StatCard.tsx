import type { ReactNode } from 'react';
import { Icon } from './Icon';

interface StatCardProps {
  icon: string;
  label: string;
  value: ReactNode;
  delta?: ReactNode;
}

export function StatCard({ icon, label, value, delta }: StatCardProps) {
  return (
    <div className="card stat-card">
      <div className="stat-card-top">
        <span className="label">{label}</span>
        <span className="stat-icon">
          <Icon name={icon} />
        </span>
      </div>
      <span className="value">{value}</span>
      {delta && <span className="delta">{delta}</span>}
    </div>
  );
}
