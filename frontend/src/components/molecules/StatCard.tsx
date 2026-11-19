import type { ReactNode } from 'react';
import { Icon } from '../atoms/Icon';
import { Card } from './Card';

interface StatCardProps {
  icon: string;
  label: string;
  value: ReactNode;
  delta?: ReactNode;
}

export function StatCard({ icon, label, value, delta }: StatCardProps) {
  return (
    <Card className="flex flex-col gap-2.5">
      <div className="flex items-start justify-between">
        <span className="text-sm text-muted">{label}</span>
        <span className="flex size-[34px] items-center justify-center rounded-sm bg-subtle text-fg">
          <Icon name={icon} />
        </span>
      </div>
      <span className="text-[28px] font-bold tracking-[-0.02em]">{value}</span>
      {delta && <span className="text-[12.5px] text-muted">{delta}</span>}
    </Card>
  );
}
