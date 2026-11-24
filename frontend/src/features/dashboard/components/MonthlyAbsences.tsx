import type { MonthlyAbsences as MonthlyAbsencesRow } from '@vacations/sdk';
import { MONTH_NAMES } from '../../../utils/calendar';

const CHART_HEIGHT = 128;

const monthName = (month: string) => MONTH_NAMES[Number(month.slice(5)) - 1];

export function MonthlyAbsences({ months }: { months: MonthlyAbsencesRow[] }) {
  const max = Math.max(...months.map((row) => row.absences), 1);

  return (
    <div>
      <div className="flex items-end gap-3" style={{ height: CHART_HEIGHT + 24 }} role="img" aria-label="Ausencias aprobadas por mes">
        {months.map((row, index) => {
          const isCurrent = index === months.length - 1;
          return (
            <div
              key={row.month}
              className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
              title={`${monthName(row.month)}: ${row.absences} ausencia${row.absences === 1 ? '' : 's'}`}
            >
              <span className="text-[12.5px] font-semibold text-fg">{row.absences}</span>
              <div
                className="w-full max-w-12 rounded-t-[4px] bg-chart-1"
                style={{ height: Math.max((row.absences / max) * CHART_HEIGHT, row.absences ? 4 : 2), opacity: isCurrent ? 1 : 0.55 }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-3 border-t border-line pt-2">
        {months.map((row) => (
          <span key={row.month} className="flex-1 text-center text-xs text-muted">
            {monthName(row.month).slice(0, 3)}
          </span>
        ))}
      </div>
    </div>
  );
}
