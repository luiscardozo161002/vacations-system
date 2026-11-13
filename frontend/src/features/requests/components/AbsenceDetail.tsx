import { useState } from 'react';
import type { CurrentUser, Notice } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { getErrorMessage } from '../../../lib/get-error-message';
import { useApiQuery } from '../../../lib/use-api-query';
import { formatAbsenceRange, formatDaysHours, initials, todayIso } from '../../../lib/format';
import { Drawer } from '../../../components/Drawer';
import { ConfirmDialog } from '../../../components/Dialog';
import { Icon } from '../../../components/Icon';
import { StatusBadge } from '../../../components/StatusBadge';
import { useToast } from '../../../components/toast-context';
import { BreakdownBox } from './BreakdownBox';

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
      const file = await sdk.notices.pdf(notice.notice_id);
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = `aviso-${notice.notice_id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
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
                <button type="button" className="btn btn-secondary" onClick={downloadPdf} disabled={working}>
                  <Icon name="download" /> Descargar PDF
                </button>
              )}
              {canCancel && (
                <button type="button" className="btn btn-secondary" onClick={() => setConfirming('cancel')} disabled={working}>
                  Cancelar
                </button>
              )}
              {canReject && (
                <button type="button" className="btn btn-secondary" onClick={() => setConfirming('reject')} disabled={working}>
                  <Icon name="x" /> Rechazar
                </button>
              )}
              {canApprove && (
                <button type="button" className="btn btn-primary" onClick={() => run('approve')} disabled={working}>
                  <Icon name="check" /> Aprobar
                </button>
              )}
            </>
          ) : (
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
          )
        }
      >
        {notice.kind === 'request' && (
          <div className="profile-head">
            <div className="avatar">{initials(notice.employee_name ?? '')}</div>
            <div>
              <h2 style={{ fontSize: 16 }}>{notice.employee_name}</h2>
              <p className="cell-sub">{notice.department_name}</p>
            </div>
          </div>
        )}
        <div className="kv-grid">
          {notice.kind === 'notice' && (
            <div className="kv-item">
              <div className="k">Empleado</div>
              <div className="v">{notice.employee_name}</div>
            </div>
          )}
          <div className="kv-item">
            <div className="k">Fecha y horario</div>
            <div className="v">{formatAbsenceRange(notice)}</div>
          </div>
          <div className="kv-item">
            <div className="k">{labels.days}</div>
            <div className="v">{formatDaysHours(notice.days_taken, notice.hours_taken)}</div>
          </div>
          <div className="kv-item">
            <div className="k">Motivo</div>
            <div className="v">{notice.reason_description}</div>
          </div>
          <div className="kv-item">
            <div className="k">Estado</div>
            <div className="v">
              <StatusBadge status={notice.status} />
            </div>
          </div>
        </div>
        {notice.remarks && (
          <>
            <div className="divider" />
            <p className="cell-sub">{notice.remarks}</p>
          </>
        )}
        {preview && (
          <>
            <div className="divider" />
            <div style={{ marginTop: 12 }}>
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
