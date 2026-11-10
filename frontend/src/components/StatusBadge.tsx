const STATUS: Record<string, [string, string]> = {
  active: ['success', 'Activo'],
  inactive: ['neutral', 'Inactivo'],
  pending: ['warning', 'Pendiente'],
  approved: ['success', 'Aprobada'],
  rejected: ['danger', 'Rechazada'],
  cancelled: ['neutral', 'Cancelada'],
  success: ['success', 'Exitoso'],
  failed: ['danger', 'Fallido'],
};

export function StatusBadge({ status }: { status: string }) {
  const [tone, label] = STATUS[status] ?? ['neutral', status];
  return <span className={`badge badge-${tone}`}>{label}</span>;
}
