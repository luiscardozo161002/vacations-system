import { useEffect, useState } from 'react';
import type { CurrentUser, Notice, NoticePreview } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { getErrorMessage } from '../../../lib/get-error-message';
import { formatAbsenceRange, formatDaysHours, initials, todayIso } from '../../../lib/format';
import { Drawer } from '../../../components/Drawer';
import { ConfirmDialog } from '../../../components/Dialog';
import { Icon } from '../../../components/Icon';
import { StatusBadge } from '../../../components/StatusBadge';
import { useToast } from '../../../components/toast-context';
import { BreakdownBox } from './BreakdownBox';

type Action = 'approve' | 'reject' | 'cancel';

interface RequestDetailProps {
  notice: Notice;
  user: CurrentUser;
  can: (permission: string) => boolean;
  onClose: () => void;
  onChanged: () => void;
}

const DONE: Record<Action, string> = {
  approve: 'aprobada',
  reject: 'rechazada',
  cancel: 'cancelada',
};

export function RequestDetail({ notice, user, can, onClose, onChanged }: RequestDetailProps) {
  const showToast = useToast();
  const [preview, setPreview] = useState<NoticePreview | null>(null);
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

  useEffect(() => {
    if (!canPreview) return;
    const controller = new AbortController();
    sdk.notices
      .preview(
        {
          employee_id: notice.employee_id,
          reason_id: notice.reason_id,
          absence_start_date: notice.absence_start_date,
          absence_end_date: notice.absence_end_date,
          absence_start_time: notice.absence_start_time,
          absence_end_time: notice.absence_end_time,
        },
        { signal: controller.signal },
      )
      .then(setPreview)
      .catch(() => undefined);
    return () => controller.abort();
  }, [canPreview, notice]);

  const run = async (action: Action) => {
    setConfirming(null);
    setWorking(true);
    try {
      await sdk.notices[action](notice.notice_id);
      showToast(`Solicitud de ${notice.employee_name} ${DONE[action]}.`);
      onChanged();
    } catch (err) {
      showToast(getErrorMessage(err));
      setWorking(false);
    }
  };

  const hasActions = canApprove || canReject || canCancel;

  return (
    <>
      <Drawer
        title="Detalle de solicitud"
        onClose={onClose}
        footer={
          hasActions ? (
            <>
              {canCancel && (
                <button type="button" className="btn btn-secondary" onClick={() => setConfirming('cancel')} disabled={working}>
                  Cancelar solicitud
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
        <div className="profile-head">
          <div className="avatar">{initials(notice.employee_name ?? '')}</div>
          <div>
            <h2 style={{ fontSize: 16 }}>{notice.employee_name}</h2>
            <p className="cell-sub">{notice.department_name}</p>
          </div>
        </div>
        <div className="kv-grid">
          <div className="kv-item">
            <div className="k">Fecha y horario</div>
            <div className="v">{formatAbsenceRange(notice)}</div>
          </div>
          <div className="kv-item">
            <div className="k">Días solicitados</div>
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
          title={confirming === 'reject' ? 'Rechazar solicitud' : 'Cancelar solicitud'}
          message={
            <>
              ¿Confirmas {confirming === 'reject' ? 'rechazar' : 'cancelar'} la solicitud de{' '}
              <strong>{notice.employee_name}</strong>?
            </>
          }
          confirmLabel={confirming === 'reject' ? 'Rechazar' : 'Cancelar solicitud'}
          onConfirm={() => run(confirming)}
          onCancel={() => setConfirming(null)}
        />
      )}
    </>
  );
}
