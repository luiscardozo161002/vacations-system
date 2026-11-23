import { useEffect, useMemo, useState } from 'react';
import type { Employee, NoticePreview, PreviewNoticeInput, Reason } from '@vacations/sdk';
import { sdk } from '../../../services/sdk';
import { getErrorMessage } from '../../../utils/get-error-message';
import { useFormSubmit } from '../../../hooks/use-form-submit';
import { todayIso } from '../../../utils/format';
import { countWorkingDays, nextWeekday } from '../../../utils/calendar';
import { fitsWithin, firstHour, type TimeRange } from '../../../utils/time';
import { FormDrawer } from '../../../components/organisms/FormDrawer';
import { Input, Textarea } from '../../../components/atoms/Input';
import { SearchSelect } from '../../../components/molecules/SearchSelect';
import { CheckboxRow } from '../../../components/molecules/CheckboxRow';
import { DatePicker } from '../../../components/molecules/DatePicker';
import { DateRangePicker, type DateRange } from '../../../components/molecules/DateRangePicker';
import { HourRangePicker } from '../../../components/molecules/HourRangePicker';
import { FormField, SelectField } from '../../../components/molecules/FormField';
import { BreakdownBox } from './BreakdownBox';
import { FieldHint } from '../../../components/atoms/FieldText';

interface FixedEmployee {
  employee_id: number;
  employee_name: string;
}

interface AbsenceFormProps {
  title: string;
  submitLabel: string;
  reasons: Reason[];
  employee?: FixedEmployee;
  employees?: Employee[];
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  employee_id: string;
  reason_id: string;
  range: DateRange;
  partial: boolean;
  hours: TimeRange | null;
  remarks: string;
}

const SATURDAY = 6;

const toPreviewInput = (form: FormState, hours: TimeRange | null): PreviewNoticeInput | null => {
  if (!form.employee_id || !form.reason_id) return null;
  const { start, end, skipSaturdays } = form.range;
  return {
    employee_id: Number(form.employee_id),
    reason_id: Number(form.reason_id),
    absence_start_date: start,
    absence_end_date: end,
    skip_saturdays: !form.partial && skipSaturdays && countWorkingDays(start, end, [SATURDAY]) > 0,
    absence_start_time: hours?.start ?? null,
    absence_end_time: hours?.end ?? null,
  };
};

export function AbsenceForm({ title, submitLabel, reasons, employee, employees = [], onClose, onSaved }: AbsenceFormProps) {
  const vacation = reasons.find((reason) => reason.affects_vacation_balance);
  const [form, setForm] = useState<FormState>({
    employee_id: employee ? String(employee.employee_id) : '',
    reason_id: String(vacation?.reason_id ?? reasons[0]?.reason_id ?? ''),
    range: { start: nextWeekday(todayIso()), end: nextWeekday(todayIso()), skipSaturdays: true },
    partial: false,
    hours: null,
    remarks: '',
  });
  const [preview, setPreview] = useState<NoticePreview | null>(null);
  const { submitting, error, setError, submit } = useFormSubmit();

  const employeeOptions = useMemo(
    () =>
      employees.map((option) => ({
        value: String(option.employee_id),
        label: `${option.employee_number} · ${option.employee_name}`,
      })),
    [employees],
  );

  const workHours = preview?.work_hours ?? null;
  const hours = form.partial && workHours ? (form.hours && fitsWithin(form.hours, workHours) ? form.hours : firstHour(workHours)) : null;

  const input = toPreviewInput(form, hours);
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
          if (!controller.signal.aborted) setError(getErrorMessage(err));
        });
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [inputKey, setError]);

  const setValue = <Field extends keyof FormState>(field: Field, value: FormState[Field]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = () => {
    if (!input) {
      setError('Selecciona un empleado válido de la lista.');
      return;
    }
    if (preview?.error) {
      setError(preview.error.message);
      return;
    }

    submit(async () => {
      await sdk.notices.create({ ...input, remarks: form.remarks.trim() || null });
      onSaved();
    });
  };

  const changePartial = (partial: boolean) =>
    setForm((prev) => ({ ...prev, partial, range: partial ? { ...prev.range, end: prev.range.start } : prev.range }));

  const partialHint = !form.partial
    ? null
    : !form.employee_id
      ? 'Elige un empleado para ver su horario.'
      : preview && !workHours
        ? 'Ese día no es laborable para el turno del empleado.'
        : null;

  return (
    <FormDrawer
      title={title}
      submitLabel={submitLabel}
      submitting={submitting}
      submitDisabled={!input || Boolean(preview?.error) || (form.partial && !hours)}
      error={error}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <FormField label="Empleado" htmlFor="af-employee">
        {employee ? (
          <Input id="af-employee" value={employee.employee_name} disabled />
        ) : (
          <SearchSelect
            id="af-employee"
            options={employeeOptions}
            value={form.employee_id}
            onChange={(value) => setValue('employee_id', value)}
            placeholder="Buscar empleado por número o nombre..."
            fullWidth
          />
        )}
      </FormField>
      <SelectField
        id="af-reason"
        label="Motivo"
        value={form.reason_id}
        onChange={(value) => setValue('reason_id', value)}
        options={reasons.map((reason) => ({ value: reason.reason_id, label: reason.description }))}
        required
      />
      <CheckboxRow className="mb-3" checked={form.partial} onCheckedChange={(checked) => changePartial(checked === true)}>
        Solo unas horas del día
      </CheckboxRow>
      {form.partial ? (
        <FormField label="Día de la ausencia" htmlFor="af-date">
          <DatePicker
            id="af-date"
            value={form.range.start}
            onChange={(date) => setValue('range', { ...form.range, start: date, end: date })}
            workingWeekdays={preview?.working_weekdays}
          />
        </FormField>
      ) : (
        <FormField label="Fechas de la ausencia" htmlFor="af-dates" hint="Para un solo día, toca el mismo día dos veces.">
          <DateRangePicker
            id="af-dates"
            value={form.range}
            onChange={(range) => setValue('range', range)}
            workingWeekdays={preview?.working_weekdays}
          />
        </FormField>
      )}
      {partialHint && <FieldHint className="mb-3">{partialHint}</FieldHint>}
      {hours && workHours && (
        <FormField
          label="Horario de la ausencia"
          htmlFor="af-hours"
          hint={`Horario del turno ese día: ${workHours.start} a ${workHours.end}.`}
        >
          <HourRangePicker id="af-hours" value={hours} workHours={workHours} onChange={(range) => setValue('hours', range)} />
        </FormField>
      )}
      <BreakdownBox
        preview={input ? preview : null}
        verb={employee ? 'Vas a tomar' : 'Va a tomar'}
        placeholder="Selecciona empleado, motivo y fechas para ver el cálculo."
      />
      <FormField label="Comentarios" htmlFor="af-remarks">
        <Textarea
          id="af-remarks"
          rows={3}
          placeholder="Opcional"
          value={form.remarks}
          onChange={(e) => setValue('remarks', e.target.value)}
        />
      </FormField>
    </FormDrawer>
  );
}
