import { useState, type FormEvent } from 'react';
import type { AccrualRule } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { getErrorMessage } from '../../../lib/get-error-message';
import { Drawer } from '../../../components/Drawer';

interface RuleFormProps {
  rule: AccrualRule | null;
  effectiveYear: number;
  onClose: () => void;
  onSaved: (message: string) => void;
}

export function RuleForm({ rule, effectiveYear, onClose, onSaved }: RuleFormProps) {
  const [yearsFrom, setYearsFrom] = useState(rule ? String(rule.years_from) : '');
  const [yearsTo, setYearsTo] = useState(rule?.years_to != null ? String(rule.years_to) : '');
  const [days, setDays] = useState(rule ? String(rule.vacation_days) : '');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!yearsFrom || !yearsTo || !days) {
      setFormError('Completa los tres campos con valores numéricos.');
      return;
    }
    if (Number(yearsTo) < Number(yearsFrom)) {
      setFormError('"Hasta" no puede ser menor que "desde".');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    const payload = { years_from: Number(yearsFrom), years_to: Number(yearsTo), vacation_days: Number(days) };
    try {
      if (rule) {
        await sdk.accrualRules.update(rule.rule_id, payload);
        onSaved('Regla actualizada.');
      } else {
        await sdk.accrualRules.create({ ...payload, effective_year: effectiveYear });
        onSaved('Regla creada.');
      }
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      title={rule ? 'Editar regla de acumulación' : 'Nueva regla de acumulación'}
      onClose={onClose}
      onSubmit={handleSubmit}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {rule ? 'Guardar cambios' : 'Crear regla'}
          </button>
        </>
      }
    >
      {formError && <p className="field-error">{formError}</p>}

      <div className="field">
        <label htmlFor="r-from">Antigüedad desde (años)</label>
        <input id="r-from" type="number" min={0} value={yearsFrom} onChange={(e) => setYearsFrom(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="r-to">Antigüedad hasta (años)</label>
        <input id="r-to" type="number" min={0} value={yearsTo} onChange={(e) => setYearsTo(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="r-days">Días otorgados</label>
        <input id="r-days" type="number" min={1} value={days} onChange={(e) => setDays(e.target.value)} />
      </div>
    </Drawer>
  );
}
