import type { ReactNode } from 'react';
import type { NoticePreview } from '@vacations/sdk';
import { cva } from 'class-variance-authority';
import { formatDaysHours } from '../../../utils/format';
import { BalanceBadges } from './BalanceBadges';

interface BreakdownBoxProps {
  preview: NoticePreview | null;
  verb?: string;
  placeholder?: string;
}

const box = cva('-mt-1.5 mb-4 rounded-md border border-line p-3 text-[12.5px] leading-[1.6] [&_strong]:font-semibold', {
  variants: {
    tone: {
      neutral: 'bg-subtle text-fg',
      danger: 'bg-danger text-danger-fg',
    },
  },
  defaultVariants: { tone: 'neutral' },
});

const restNote = (restDays: number, holidays: number): string => {
  const parts = [];
  if (restDays) parts.push(`${restDays} día${restDays === 1 ? '' : 's'} de descanso`);
  if (holidays) parts.push(`${holidays} festivo${holidays === 1 ? '' : 's'}`);
  if (!parts.length) return '';
  const plural = restDays + holidays > 1;
  return ` (${parts.join(' y ')} en el rango no se descuenta${plural ? 'n' : ''})`;
};

const Box = ({ tone, children }: { tone?: 'neutral' | 'danger'; children: ReactNode }) => (
  <div role={tone === 'danger' ? 'alert' : 'status'} className={box({ tone })}>
    {children}
  </div>
);

export function BreakdownBox({ preview, verb = 'Vas a tomar', placeholder }: BreakdownBoxProps) {
  if (!preview) return <Box>{placeholder}</Box>;

  const { breakdown, balance, error } = preview;

  if (!breakdown) {
    return <Box tone="danger">{error?.message}</Box>;
  }

  const taken = formatDaysHours(breakdown.days, breakdown.hours);
  const note = restNote(breakdown.rest_days, breakdown.holidays);
  const badges = balance && (
    <div className="mt-2 text-fg">
      <BalanceBadges
        total={balance.total_days}
        used={balance.used}
        available={balance.available}
        remaining={preview.affects_balance ? balance.remaining : null}
      />
    </div>
  );

  if (error?.code === 'INSUFFICIENT_BALANCE' && balance) {
    return (
      <Box tone="danger">
        <strong>Esta solicitud excede los días de vacaciones disponibles.</strong>
        <br />
        {verb}: {taken}
        {note}.
        <br />
        Turno de {breakdown.daily_hours} h por día.
        {badges}
      </Box>
    );
  }

  if (error) {
    return (
      <Box tone="danger">
        <strong>{error.message}.</strong>
        <br />
        {verb}: {taken}
        {note}.
      </Box>
    );
  }

  return (
    <Box>
      {verb}: <strong>{taken}</strong>
      {note}.
      {!preview.affects_balance && (
        <>
          <br />
          Este motivo no descuenta de las vacaciones.
        </>
      )}
      {badges}
    </Box>
  );
}
