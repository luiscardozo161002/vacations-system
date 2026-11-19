import { useState } from 'react';
import type { AccrualRule } from '@vacations/sdk';
import { sdk } from '../../../api/sdk';
import { useFormSubmit } from '../../../hooks/use-form-submit';
import { FormDrawer } from '../../../components/organisms/FormDrawer';
import { TextField } from '../../../components/molecules/FormField';

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
  const { submitting, error, setError, submit } = useFormSubmit();

  const handleSubmit = () => {
    if (!yearsFrom || !yearsTo || !days) {
      setError('Completa los tres campos con valores numéricos.');
      return;
    }
    if (Number(yearsTo) < Number(yearsFrom)) {
      setError('"Hasta" no puede ser menor que "desde".');
      return;
    }

    const payload = { years_from: Number(yearsFrom), years_to: Number(yearsTo), vacation_days: Number(days) };
    submit(async () => {
      if (rule) {
        await sdk.accrualRules.update(rule.rule_id, payload);
        onSaved('Regla actualizada.');
      } else {
        await sdk.accrualRules.create({ ...payload, effective_year: effectiveYear });
        onSaved('Regla creada.');
      }
    });
  };

  return (
    <FormDrawer
      title={rule ? 'Editar regla de acumulación' : 'Nueva regla de acumulación'}
      submitLabel={rule ? 'Guardar cambios' : 'Crear regla'}
      submitting={submitting}
      error={error}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <TextField id="r-from" label="Antigüedad desde (años)" type="number" min={0} value={yearsFrom} onChange={setYearsFrom} />
      <TextField id="r-to" label="Antigüedad hasta (años)" type="number" min={0} value={yearsTo} onChange={setYearsTo} />
      <TextField id="r-days" label="Días otorgados" type="number" min={1} value={days} onChange={setDays} />
    </FormDrawer>
  );
}
