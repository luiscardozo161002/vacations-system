import type { AuditLogEntry } from '@vacations/sdk';
import { formatDateTime } from '../../../utils/format';
import { describeDevice } from '../../../utils/user-agent';
import { ROLE_LABELS } from '../../../layouts/navigation';
import { Drawer } from '../../../components/organisms/Drawer';
import { Button } from '../../../components/atoms/Button';
import { Divider } from '../../../components/atoms/Divider';
import { StatusBadge } from '../../../components/atoms/StatusBadge';
import { KeyValue, KeyValueGrid } from '../../../components/molecules/KeyValue';
import { FIELD_LABELS, eventLabel, formatChangeValue, moduleLabel, targetLabel } from '../labels';

interface AuditDetailProps {
  entry: AuditLogEntry;
  onClose: () => void;
}

export function AuditDetail({ entry, onClose }: AuditDetailProps) {
  const changes = Object.entries(entry.metadata?.changes ?? {});
  const target = targetLabel(entry);
  const device = describeDevice(entry.user_agent);

  return (
    <Drawer
      title="Detalle del evento"
      onClose={onClose}
      footer={
        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      <KeyValueGrid>
        <KeyValue label="Quién">{entry.username ?? 'Desconocido'}</KeyValue>
        <KeyValue label="Rol">{ROLE_LABELS[entry.role_code ?? ''] ?? entry.role_code ?? '—'}</KeyValue>
        <KeyValue label="Empleado">{entry.actor_name ?? '—'}</KeyValue>
        <KeyValue label="Cuándo">{formatDateTime(entry.created_at)}</KeyValue>
        <KeyValue label="Módulo">{moduleLabel(entry)}</KeyValue>
        <KeyValue label="Acción">{eventLabel(entry)}</KeyValue>
        {target && <KeyValue label="Sobre">{entry.target_name ? `${entry.target_name} (#${entry.entity_id})` : target}</KeyValue>}
        <KeyValue label="Resultado">
          <StatusBadge status={entry.result} />
        </KeyValue>
        {entry.metadata?.error && <KeyValue label="Motivo del fallo">{entry.metadata.error}</KeyValue>}
      </KeyValueGrid>

      <Divider />
      <p className="mt-3 mb-2 text-xs font-semibold text-muted uppercase">Cómo</p>
      <KeyValueGrid>
        <KeyValue label="Dispositivo">{device ?? '—'}</KeyValue>
        <KeyValue label="Dirección IP">{entry.ip_address ?? '—'}</KeyValue>
        {entry.http_method && (
          <KeyValue label="Petición" valueClassName="break-all">
            {entry.http_method} {entry.route}
          </KeyValue>
        )}
        <KeyValue label="Folio de la petición" valueClassName="break-all">
          {entry.request_id ?? '—'}
        </KeyValue>
      </KeyValueGrid>

      {changes.length > 0 && (
        <>
          <Divider />
          <p className="mt-3 mb-2 text-xs font-semibold text-muted uppercase">Datos enviados</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[13.5px]">
            {changes.map(([field, value]) => (
              <div key={field} className="contents">
                <dt className="text-muted">{FIELD_LABELS[field] ?? field}</dt>
                <dd className="font-medium break-words">{formatChangeValue(value)}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </Drawer>
  );
}
