import type { NoticePreview } from '@vacations/sdk';
import { formatDaysHours } from '../../../lib/format';

interface BreakdownBoxProps {
  preview: NoticePreview | null;
  verb?: string;
  placeholder?: string;
}

const restNote = (restDays: number): string =>
  restDays
    ? ` (${restDays} día${restDays === 1 ? '' : 's'} de descanso en el rango no se descuenta${restDays === 1 ? '' : 'n'})`
    : '';

export function BreakdownBox({ preview, verb = 'Vas a tomar', placeholder }: BreakdownBoxProps) {
  if (!preview) return <div className="request-breakdown">{placeholder}</div>;

  const { breakdown, balance, error } = preview;

  if (!breakdown) {
    return <div className="request-breakdown danger">{error?.message}</div>;
  }

  const taken = formatDaysHours(breakdown.days, breakdown.hours);
  const note = restNote(breakdown.rest_days);

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
