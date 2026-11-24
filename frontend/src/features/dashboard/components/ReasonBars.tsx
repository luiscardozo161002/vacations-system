import type { ReasonAbsences } from '@vacations/sdk';
import { ProgressBar } from '../../../components/atoms/ProgressBar';

const MAX_ROWS = 6;

const foldTail = (reasons: ReasonAbsences[]): ReasonAbsences[] => {
  if (reasons.length <= MAX_ROWS) return reasons;
  const rest = reasons.slice(MAX_ROWS - 1);
  return [
    ...reasons.slice(0, MAX_ROWS - 1),
    { reason_description: 'Otros', absences: rest.reduce((sum, reason) => sum + reason.absences, 0) },
  ];
};

export function ReasonBars({ reasons }: { reasons: ReasonAbsences[] }) {
  const rows = foldTail(reasons);
  const max = Math.max(...rows.map((row) => row.absences), 1);

  return (
    <div>
      {rows.map((row) => (
        <div key={row.reason_description} className="mb-3 last:mb-0">
          <div className="mb-1.5 flex justify-between text-[12.5px]">
            <span>{row.reason_description}</span>
            <span className="font-semibold">{row.absences}</span>
          </div>
          <ProgressBar percent={(row.absences / max) * 100} color="var(--chart-1)" />
        </div>
      ))}
    </div>
  );
}
