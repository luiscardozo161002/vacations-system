import { useEffect, useState } from 'react';
import type { Branch, Company, CreateBranchInput } from '@vacations/sdk';
import { sdk } from '../../../services/sdk';
import { useFormSubmit } from '../../../hooks/use-form-submit';
import { FormDrawer } from '../../../components/organisms/FormDrawer';
import { FormField, SelectField, TextField } from '../../../components/molecules/FormField';
import { Input } from '../../../components/atoms/Input';
import { ColorPopover } from '../../../components/molecules/ColorPopover';
import { ORG_COLORS } from '../../organization/colors';
import { BRANCH_NAME_MAX, CODE_MAX, cleanCode, validateBranch, type BranchValues } from '../validation';

interface BranchFormProps {
  branch: Branch | null;
  companies: Company[];
  defaultCompanyId: number | undefined;
  onClose: () => void;
  onSaved: (message: string) => void;
}

export function BranchForm({ branch, companies, defaultCompanyId, onClose, onSaved }: BranchFormProps) {
  const [initial] = useState<BranchValues>(() => ({
    company_id: String(branch?.company_id ?? defaultCompanyId ?? companies[0]?.company_id ?? ''),
    code: branch?.code ?? '',
    branch_name: branch?.branch_name ?? '',
    color: branch?.color ?? null,
  }));
  const [form, setForm] = useState<BranchValues>(initial);
  const [editing, setEditing] = useState(!branch);
  const [submitted, setSubmitted] = useState(false);
  const { submitting, error, submit } = useFormSubmit();

  const errors = submitted ? validateBranch(form) : {};
  const changed = (Object.keys(form) as (keyof BranchValues)[]).some((field) => form[field] !== initial[field]);

  useEffect(() => {
    if (branch && editing) document.getElementById('br-name')?.focus();
  }, [branch, editing]);

  const setField = <Field extends keyof BranchValues>(field: Field, value: BranchValues[Field]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    setSubmitted(true);
    return Object.keys(validateBranch(form)).length === 0;
  };

  const handleSubmit = () => {
    const payload: CreateBranchInput = {
      company_id: Number(form.company_id),
      code: form.code,
      branch_name: form.branch_name.trim(),
      color: form.color,
    };

    submit(async () => {
      if (branch) {
        await sdk.branches.update(branch.branch_id, payload);
        onSaved('Sede actualizada.');
      } else {
        await sdk.branches.create(payload);
        onSaved('Sede creada.');
      }
    });
  };

  return (
    <FormDrawer
      title={branch ? 'Editar sede' : 'Nueva sede'}
      submitLabel={branch ? 'Guardar cambios' : 'Crear sede'}
      submitting={submitting}
      submitDisabled={Boolean(branch) && !changed}
      error={error}
      readOnly={!editing}
      noValidate
      validate={validate}
      confirm={branch ? `¿Guardar los cambios de la sede ${branch.branch_name}?` : undefined}
      onEdit={() => setEditing(true)}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      {branch ? (
        <FormField label="Empresa" htmlFor="br-company" hint="Una sede no cambia de empresa.">
          <Input id="br-company" value={branch.company_name ?? ''} disabled />
        </FormField>
      ) : (
        <SelectField
          id="br-company"
          label="Empresa"
          value={form.company_id}
          onChange={(value) => setField('company_id', value)}
          options={companies.map((company) => ({ value: company.company_id, label: `${company.folio} · ${company.company_name}` }))}
        />
      )}
      <TextField
        id="br-name"
        label="Nombre de la sede"
        value={form.branch_name}
        onChange={(value) => setField('branch_name', value)}
        maxLength={BRANCH_NAME_MAX}
        placeholder="Ej. Hidalgo"
        error={errors.branch_name}
        data-autofocus
      />
      <TextField
        id="br-code"
        label="Código"
        value={form.code}
        onChange={(value) => setField('code', cleanCode(value))}
        maxLength={CODE_MAX}
        placeholder="Ej. THH_HGO"
        hint="Empresa y sede, con guion bajo. Se muestra sin el guion bajo."
        error={errors.code}
      />
      <FormField label="Color" htmlFor="br-color" hint="Si no eliges uno, la sede usa el color de su empresa.">
        <div className="flex items-center gap-2.5">
          <ColorPopover label="Color de la sede" value={form.color} colors={ORG_COLORS} onPick={(color) => setField('color', color)} />
          <span className="text-[12.5px] text-muted">{form.color ?? 'El de la empresa'}</span>
        </div>
      </FormField>
    </FormDrawer>
  );
}
