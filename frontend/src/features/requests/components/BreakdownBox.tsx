import type { NoticePreview } from '@vacations/sdk';
import { formatDaysHours } from '../../../lib/format';

interface BreakdownBoxProps {
  preview: NoticePreview | null;
  verb?: string;
  placeholder?: string;
}

const restNote = (restDays: number, holidays: number): string => {
  const parts = [];
  if (restDays) parts.push(`${restDays} día${restDays === 1 ? '' : 's'} de descanso`);
  if (holidays) parts.push(`${holidays} festivo${holidays === 1 ? '' : 's'}`);
  if (!parts.length) return '';
  const plural = restDays + holidays > 1;
  return ` (${parts.join(' y ')} en el rango no se descuenta${plural ? 'n' : ''})`;
};

export function BreakdownBox({ preview, verb = 'Vas a tomar', placeholder }: BreakdownBoxProps) {
  if (!preview) return <div className="request-breakdown">{placeholder}</div>;

  const { breakdown, balance, error } = preview;

  if (!breakdown) {
    return <div className="request-breakdown danger">{error?.message}</div>;
  }

  const taken = formatDaysHours(breakdown.days, breakdown.hours);
  const note = restNote(breakdown.rest_days, breakdown.holidays);

  if (error?.code === 'INSUFFICIENT_BALANCE' && balance) {
    return (
      <div className="request-breakdown danger">
        <strong>Esta solicitud excede el saldo disponible.</strong>
        <br />
        {verb}: {taken}
        {note}.
        <br />
        Saldo actual: {formatDaysHours(balance.available.days, balance.available.hours)} (turno {breakdown.daily_hours}h/día).
      </div>
    );
  }

  if (error) {
    return (
      <div className="request-breakdown danger">
        <strong>{error.message}.</strong>
        <br />
        {verb}: {taken}
        {note}.
      </div>
    );
  }

  return (
    <div className="request-breakdown">
      {verb}: <strong>{taken}</strong>
      {note}.
      {balance && (
        <>
          <br />
          Saldo actual: {formatDaysHours(balance.available.days, balance.available.hours)} · Saldo restante:{' '}
          <strong>{formatDaysHours(balance.remaining.days, balance.remaining.hours)}</strong>.
        </>
      )}
    </div>
  );
}
