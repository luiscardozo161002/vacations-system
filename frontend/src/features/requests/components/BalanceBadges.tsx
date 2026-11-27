import type { DaysAndHours } from '@vacations/sdk';
import { Badge } from '../../../components/atoms/Badge';

interface BalanceBadgesProps {
  total: number;
  used: DaysAndHours;
  available: DaysAndHours;
  remaining?: DaysAndHours | null;
}

const days = (count: number) => `${count} día${count === 1 ? '' : 's'}`;
const hours = (count: number) => `${count} h`;

function Row({ label, value, tone }: { label: string; value: DaysAndHours; tone: 'neutral' | 'warning' | 'success' }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 text-xs text-muted">{label}</span>
      <Badge tone={tone}>{days(value.days)}</Badge>
      <Badge tone={tone}>{hours(value.hours)}</Badge>
    </div>
  );
}

export function BalanceBadges({ total, used, available, remaining }: BalanceBadgesProps) {
  return (
    <div className="flex flex-col gap-1.5" aria-label="Días de vacaciones">
      <Row label="Otorgados" value={{ days: total, hours: 0 }} tone="neutral" />
      <Row label="Usados" value={used} tone="warning" />
      <Row label="Disponibles" value={available} tone="success" />
      {remaining && <Row label="Quedarían" value={remaining} tone="neutral" />}
    </div>
  );
}
