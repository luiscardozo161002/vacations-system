export const formatCode = (code: string): string => code.replace(/_/g, ' ');

export const initial =(name: string): string => name.trim().charAt(0).toUpperCase();

export const formatDate = (iso: string): string =>
  new Date(iso.length > 10 ? iso : `${iso}T00:00:00`).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export const todayIso = (offsetDays = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const formatDaysHours = (days: number, hours: number): string => {
  const parts = [];
  if (days) parts.push(`${days} día${days === 1 ? '' : 's'}`);
  if (hours) parts.push(`${hours} hora${hours === 1 ? '' : 's'}`);
  return parts.length ? parts.join(' y ') : '0 días';
};

const shortTime = (time: string): string => time.slice(0, 5);

interface Absence {
  absence_start_date: string;
  absence_end_date: string;
  absence_start_time: string | null;
  absence_end_time: string | null;
}

export const absenceHours = (absence: Absence): string | null =>
  absence.absence_start_time || absence.absence_end_time
    ? `${shortTime(absence.absence_start_time ?? '00:00')} – ${shortTime(absence.absence_end_time ?? '23:59')}`
    : null;

export const absenceDates = (absence: Absence): string => {
  const start = formatDate(absence.absence_start_date);
  return absence.absence_start_date === absence.absence_end_date ? start : `${start} – ${formatDate(absence.absence_end_date)}`;
};

export const formatAbsenceRange = (absence: Absence): string => {
  const hours = absenceHours(absence);
  if (!hours) return absenceDates(absence);
  if (absence.absence_start_date === absence.absence_end_date) return `${absenceDates(absence)} · ${hours}`;
  return `${formatDate(absence.absence_start_date)} ${shortTime(absence.absence_start_time ?? '00:00')} – ${formatDate(absence.absence_end_date)} ${shortTime(absence.absence_end_time ?? '23:59')}`;
};

export const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
