import { useState } from 'react';
import type { CurrentUser, Notice } from '@vacations/sdk';
import { sdk } from '../../../api/sdk';
import { getErrorMessage } from '../../../utils/get-error-message';
import { useApiQuery } from '../../../hooks/use-api-query';
import { saveFile } from '../../../utils/save-file';
import { formatAbsenceRange, formatDaysHours, initials, todayIso } from '../../../utils/format';
import { Drawer } from '../../../components/organisms/Drawer';
import { ConfirmDialog } from '../../../components/organisms/Dialog';
import { Icon } from '../../../components/atoms/Icon';
import { StatusBadge } from '../../../components/atoms/StatusBadge';
import { useToast } from '../../../hooks/use-toast';
import { BreakdownBox } from './BreakdownBox';
import { Button } from '../../../components/atoms/Button';
import { KeyValue, KeyValueGrid } from '../../../components/molecules/KeyValue';
import { Avatar } from '../../../components/atoms/Avatar';
import { Divider } from '../../../components/atoms/Divider';

type Action = 'approve' | 'reject' | 'cancel';

interface AbsenceDetailProps {
  notice: Notice;
  user: CurrentUser;
  can: (permission: string) => boolean;
  onClose: () => void;
  onChanged: () => void;
}

const LABELS = {
  request: {
    title: 'Detalle de solicitud',
    noun: 'la solicitud',
    subject: 'Solicitud',
    days: 'Días solicitados',
    done: { approve: 'aprobada', reject: 'rechazada', cancel: 'cancelada' },
  },
  notice: {
    title: 'Detalle del aviso',
    noun: 'el aviso',
    subject: 'Aviso',
    days: 'Días',
    done: { approve: 'aprobado', reject: 'rechazado', cancel: 'cancelado' },
  },
} as const;

export function AbsenceDetail({ notice, user, can, onClose, onChanged }: AbsenceDetailProps) {
  const labels = LABELS[notice.kind];
  const showToast = useToast();
  const [confirming, setConfirming] = useState<Action | null>(null);
  const [working, setWorking] = useState(false);

  const isPending = notice.status === 'pending';
  const isReviewer = can('approvals:review');
  const allows = (action: Action) => isReviewer && user.review_actions.includes(action);
  const canPreview = isPending && (can('requests:create') || can('notices:create'));

  const canApprove = isPending && allows('approve');
  const canReject = isPending && allows('reject');
  const canCancel = isReviewer
    ? allows('cancel') && (isPending || (notice.status === 'approved' && notice.absence_start_date > todayIso()))
    : isPending && notice.employee_id === user.employee?.employee_id;

  const { data: preview } = useApiQuery(
    ['notices', 'preview', notice.notice_id],
    (signal) =>
      sdk.notices.preview(
        {
          employee_id: notice.employee_id,
          reason_id: notice.reason_id,
          absence_start_date: notice.absence_start_date,
          absence_end_date: notice.absence_end_date,
          absence_start_time: notice.absence_start_time,
          absence_end_time: notice.absence_end_time,
        },
        { signal },
      ),
    canPreview,
  );

  const run = async (action: Action) => {
    setConfirming(null);
    setWorking(true);
    try {
      await sdk.notices[action](notice.notice_id);
      showToast(`${labels.subject} de ${notice.employee_name} ${labels.done[action]}.`);
      onChanged();
    } catch (err) {
      showToast(getErrorMessage(err));
      setWorking(false);
    }
  };

  const downloadPdf = async () => {
    setWorking(true);
    try {
      saveFile(await sdk.notices.pdf(notice.notice_id), `aviso-${notice.notice_id}.pdf`);
    } catch (err) {
      showToast(getErrorMessage(err));
    } finally {
      setWorking(false);
    }
  };

  const canDownload = notice.status === 'approved';
  const hasActions = canApprove || canReject || canCancel || canDownload;

  return (
    <>
      <Drawer
        title={labels.title}
        onClose={onClose}
        footer={
          hasActions ? (
            <>
              {canDownload && (
                <Button variant="secondary" onClick={downloadPdf} disabled={working}>
                  <Icon name="download" /> Descargar PDF
                </Button>
              )}
              {canCancel && (
                <Button variant="secondary" onClick={() => setConfirming('cancel')} disabled={working}>
                  Cancelar
                </Button>
              )}
              {canReject && (
                <Button variant="secondary" onClick={() => setConfirming('reject')} disabled={working}>
                  <Icon name="x" /> Rechazar
                </Button>
              )}
              {canApprove && (
                <Button onClick={() => run('approve')} disabled={working}>
                  <Icon name="check" /> Aprobar
                </Button>
              )}
            </>
          ) : (
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
          )
        }
      >
        {notice.kind === 'request' && (
          <div className="mb-[18px] flex items-center gap-3.5">
            <Avatar size="lg">{initials(notice.employee_name ?? '')}</Avatar>
            <div>
              <h2 className="text-lg">{notice.employee_name}</h2>
              <p className="text-[12.5px] text-muted">{notice.department_name}</p>
            </div>
          </div>
        )}
        <KeyValueGrid>
          {notice.kind === 'notice' && (
            <KeyValue label="Empleado">{notice.employee_name}</KeyValue>
          )}
          <KeyValue label="Fecha y horario">{formatAbsenceRange(notice)}</KeyValue>
          <KeyValue label={labels.days}>{formatDaysHours(notice.days_taken, notice.hours_taken)}</KeyValue>
          <KeyValue label="Motivo">{notice.reason_description}</KeyValue>
          <KeyValue label="Estado"><StatusBadge status={notice.status} /></KeyValue>
        </KeyValueGrid>
        {notice.remarks && (
          <>
            <Divider />
            <p className="text-[12.5px] text-muted">{notice.remarks}</p>
          </>
        )}
        {preview && (
          <>
            <Divider />
            <div className="mt-3">
              <BreakdownBox preview={preview} verb="Consume" />
            </div>
          </>
        )}
      </Drawer>

      {confirming && confirming !== 'approve' && (
        <ConfirmDialog
          title={`${confirming === 'reject' ? 'Rechazar' : 'Cancelar'} ${labels.subject.toLowerCase()}`}
          message={
            <>
              ¿Confirmas {confirming === 'reject' ? 'rechazar' : 'cancelar'} {labels.noun} de <strong>{notice.employee_name}</strong>?
            </>
          }
          confirmLabel={confirming === 'reject' ? 'Rechazar' : 'Cancelar'}
          onConfirm={() => run(confirming)}
          onCancel={() => setConfirming(null)}
        />
      )}
    </>
  );
}
