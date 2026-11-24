import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { Icon } from '../atoms/Icon';
import { Card } from './Card';

const TONES = {
  neutral: 'bg-subtle text-fg',
  blue: 'bg-[color-mix(in_srgb,var(--chart-1)_16%,transparent)] text-chart-1',
  orange: 'bg-[color-mix(in_srgb,var(--chart-2)_16%,transparent)] text-chart-2',
  aqua: 'bg-[color-mix(in_srgb,var(--chart-3)_16%,transparent)] text-chart-3',
  violet: 'bg-[color-mix(in_srgb,var(--chart-4)_16%,transparent)] text-chart-4',
};

interface StatCardProps {
  icon: string;
  label: string;
  value: ReactNode;
  delta?: ReactNode;
  tone?: keyof typeof TONES;
}

export function StatCard({ icon, label, value, delta, tone = 'neutral' }: StatCardProps) {
  return (
    <Card className="flex flex-col gap-2.5">
      <div className="flex items-start justify-between">
        <span className="text-sm text-muted">{label}</span>
        <span className={cn('flex size-10 items-center justify-center rounded-full', TONES[tone])}>
          <Icon name={icon} />
        </span>
      </div>
      <span className="text-[28px] font-bold tracking-[-0.02em]">{value}</span>
      {delta && <span className="text-[12.5px] text-muted">{delta}</span>}
    </Card>
  );
}
