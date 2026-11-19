export const initials = (name: string): string =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

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

export const formatAbsenceRange = (absence: {
  absence_start_date: string;
  absence_end_date: string;
  absence_start_time: string | null;
  absence_end_time: string | null;
}): string => {
  const start = formatDate(absence.absence_start_date);
  const end = formatDate(absence.absence_end_date);
  if (!absence.absence_start_time && !absence.absence_end_time) return `${start} – ${end}`;
  return `${start} ${shortTime(absence.absence_start_time ?? '00:00')} – ${end} ${shortTime(absence.absence_end_time ?? '23:59')}`;
};

export const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
