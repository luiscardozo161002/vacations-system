import { useEffect, useState, type FormEvent } from 'react';
import type { CurrentUser, NoticePreview, PreviewNoticeInput, Reason } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { getErrorMessage } from '../../../lib/get-error-message';
import { todayIso } from '../../../lib/format';
import { Drawer } from '../../../components/Drawer';
import { BreakdownBox } from './BreakdownBox';

interface RequestFormProps {
  user: CurrentUser;
  reasons: Reason[];
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  reason_id: string;
  start: string;
  end: string;
  startHour: string;
  endHour: string;
  remarks: string;
}

const FULL_DAY = { start: 0, end: 23 };

const hourToTime = (hour: string): string => `${String(Number(hour)).padStart(2, '0')}:00`;

const toPreviewInput = (employeeId: number, form: FormState): PreviewNoticeInput | null => {
  if (!form.reason_id || !form.start || !form.end) return null;
  const fullDay = Number(form.startHour) === FULL_DAY.start && Number(form.endHour) === FULL_DAY.end;
  return {
    employee_id: employeeId,
    reason_id: Number(form.reason_id),
    absence_start_date: form.start,
    absence_end_date: form.end,
    absence_start_time: fullDay ? null : hourToTime(form.startHour),
    absence_end_time: fullDay ? null : hourToTime(form.endHour),
  };
};

export function RequestForm({ user, reasons, onClose, onSaved }: RequestFormProps) {
  const employee = user.employee;
  const vacation = reasons.find((reason) => reason.affects_vacation_balance);
  const [form, setForm] = useState<FormState>({
    reason_id: String(vacation?.reason_id ?? reasons[0]?.reason_id ?? ''),
    start: todayIso(7),
    end: todayIso(9),
    startHour: String(FULL_DAY.start),
    endHour: String(FULL_DAY.end),
    remarks: '',
  });
  const [preview, setPreview] = useState<NoticePreview | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const input = employee ? toPreviewInput(employee.employee_id, form) : null;
  const inputKey = JSON.stringify(input);

  useEffect(() => {
    const previewInput: PreviewNoticeInput | null = JSON.parse(inputKey);
    if (!previewInput) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      sdk.notices
        .preview(previewInput, { signal: controller.signal })
        .then(setPreview)
        .catch((err: unknown) => {
          if (!controller.signal.aborted) setFormError(getErrorMessage(err));
        });
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [inputKey]);

  const setField = (field: keyof FormState) => (e: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input) return;
    if (preview?.error) {
      setFormError(preview.error.message);
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await sdk.notices.create({ ...input, remarks: form.remarks.trim() || null });
      onSaved();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      title="Nueva solicitud de aviso de ausencia"
      onClose={onClose}
      onSubmit={handleSubmit}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting || !input || Boolean(preview?.error)}>
            Enviar solicitud
          </button>
        </>
      }
    >
      {formError && <p className="field-error">{formError}</p>}

      <div className="field">
        <label>Empleado</label>
        <input value={employee?.employee_name ?? user.username} disabled />
      </div>
      <div className="field">
        <label htmlFor="rf-reason">Motivo</label>
        <select id="rf-reason" value={form.reason_id} onChange={setField('reason_id')} required>
          {reasons.map((reason) => (
            <option key={reason.reason_id} value={reason.reason_id}>
              {reason.description}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="rf-start">Fecha de inicio</label>
        <input id="rf-start" type="date" value={form.start} onChange={setField('start')} required />
      </div>
      <div className="field">
        <label htmlFor="rf-end">Fecha de fin</label>
        <input id="rf-end" type="date" value={form.end} onChange={setField('end')} min={form.start} required />
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="rf-start-hour">Hora de inicio</label>
          <input id="rf-start-hour" type="number" min={0} max={23} value={form.startHour} onChange={setField('startHour')} />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="rf-end-hour">Hora de fin</label>
          <input id="rf-end-hour" type="number" min={0} max={23} value={form.endHour} onChange={setField('endHour')} />
        </div>
      </div>
      <p className="field-hint">Deja el horario en 0–23 para una solicitud de día completo.</p>
      <BreakdownBox preview={input ? preview : null} placeholder="Selecciona motivo y fechas para ver el cálculo." />
      <div className="field">
        <label htmlFor="rf-remarks">Comentarios</label>
        <textarea id="rf-remarks" rows={3} placeholder="Opcional" value={form.remarks} onChange={setField('remarks')} />
      </div>
    </Drawer>
  );
}
