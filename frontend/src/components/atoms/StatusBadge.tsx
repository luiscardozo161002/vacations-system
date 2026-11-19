import { Badge, type BadgeProps } from './Badge';

const STATUS: Record<string, [NonNullable<BadgeProps['tone']>, string]> = {
  active: ['success', 'Activo'],
  inactive: ['neutral', 'Inactivo'],
  locked: ['danger', 'Bloqueado'],
  pending: ['warning', 'Pendiente'],
  approved: ['success', 'Aprobada'],
  rejected: ['danger', 'Rechazada'],
  cancelled: ['neutral', 'Cancelada'],
  success: ['success', 'Exitoso'],
  failed: ['danger', 'Fallido'],
};

export function StatusBadge({ status }: { status: string }) {
  const [tone, label] = STATUS[status] ?? ['neutral', status];
  return <Badge tone={tone}>{label}</Badge>;
}
