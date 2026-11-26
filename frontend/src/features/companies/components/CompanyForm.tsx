import { useEffect, useState } from 'react';
import type { Company, CreateCompanyInput } from '@vacations/sdk';
import { sdk } from '../../../services/sdk';
import { useFormSubmit } from '../../../hooks/use-form-submit';
import { FormDrawer } from '../../../components/organisms/FormDrawer';
import { FormField, TextField } from '../../../components/molecules/FormField';
import { ColorPopover } from '../../../components/molecules/ColorPopover';
import { ORG_COLORS } from '../../organization/colors';
import {
  FOLIO_MAX,
  NAME_MAX,
  PHONE_MAX,
  RFC_MAX,
  TEXT_MAX,
  cleanFolio,
  cleanRfc,
  validateCompany,
  type CompanyValues,
} from '../validation';

interface CompanyFormProps {
  company: Company | null;
  onClose: () => void;
  onSaved: (message: string, saved: Company) => void;
}

const toValues = (company: Company | null): CompanyValues => ({
  folio: company?.folio ?? '',
  company_name: company?.company_name ?? '',
  rfc: company?.rfc ?? '',
  phone_number: company?.phone_number ?? '',
  location: company?.location ?? '',
  logo: company?.logo ?? '',
  color: company?.color ?? null,
});

export function CompanyForm({ company, onClose, onSaved }: CompanyFormProps) {
  const [initial] = useState(() => toValues(company));
  const [form, setForm] = useState<CompanyValues>(initial);
  const [editing, setEditing] = useState(!company);
  const [submitted, setSubmitted] = useState(false);
  const { submitting, error, submit } = useFormSubmit();

  const errors = submitted ? validateCompany(form) : {};
  const changed = (Object.keys(form) as (keyof CompanyValues)[]).some((field) => form[field] !== initial[field]);

  useEffect(() => {
    if (company && editing) document.getElementById('co-name')?.focus();
  }, [company, editing]);

  const setField = <Field extends keyof CompanyValues>(field: Field, value: CompanyValues[Field]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    setSubmitted(true);
    return Object.keys(validateCompany(form)).length === 0;
  };

  const handleSubmit = () => {
    const payload: CreateCompanyInput = {
      folio: form.folio,
      company_name: form.company_name.trim(),
      rfc: form.rfc || null,
      phone_number: form.phone_number.trim() || null,
      location: form.location.trim() || null,
      logo: form.logo.trim() || null,
      color: form.color,
    };

    submit(async () => {
      if (company) onSaved('Empresa actualizada.', await sdk.companies.update(company.company_id, payload));
      else onSaved('Empresa creada.', await sdk.companies.create(payload));
    });
  };

  return (
    <FormDrawer
      title={company ? 'Editar empresa' : 'Nueva empresa'}
      submitLabel={company ? 'Guardar cambios' : 'Crear empresa'}
      submitting={submitting}
      submitDisabled={Boolean(company) && !changed}
      error={error}
      readOnly={!editing}
      noValidate
      validate={validate}
      confirm={company ? `¿Guardar los cambios de ${company.company_name}?` : undefined}
      onEdit={() => setEditing(true)}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <TextField
        id="co-name"
        label="Razón social"
        value={form.company_name}
        onChange={(value) => setField('company_name', value)}
        maxLength={NAME_MAX}
        placeholder="Ej. TRANSPORTES HIDRO HIDALGUENSES S.A. DE C.V."
        error={errors.company_name}
        data-autofocus
      />
      <TextField
        id="co-folio"
        label="Folio"
        value={form.folio}
        onChange={(value) => setField('folio', cleanFolio(value))}
        maxLength={FOLIO_MAX}
        placeholder="Ej. THH"
        hint="Abreviatura corta de la empresa. Se muestra en las insignias."
        error={errors.folio}
      />
      <TextField
        id="co-rfc"
        label="RFC"
        value={form.rfc}
        onChange={(value) => setField('rfc', cleanRfc(value))}
        maxLength={RFC_MAX}
        placeholder="Ej. THH981218DS0"
        error={errors.rfc}
      />
      <TextField
        id="co-phone"
        label="Teléfono"
        value={form.phone_number}
        onChange={(value) => setField('phone_number', value)}
        maxLength={PHONE_MAX}
        error={errors.phone_number}
      />
      <TextField
        id="co-location"
        label="Dirección"
        value={form.location}
        onChange={(value) => setField('location', value)}
        maxLength={TEXT_MAX}
        error={errors.location}
      />
      <TextField
        id="co-logo"
        label="Logotipo (dirección web)"
        value={form.logo}
        onChange={(value) => setField('logo', value)}
        maxLength={TEXT_MAX}
        placeholder="https://..."
        hint="Es el logotipo que sale en los avisos de ausencia en PDF."
        error={errors.logo}
      />
      {form.logo && !errors.logo && (
        <img src={form.logo} alt="Vista previa del logotipo" className="mb-4 h-16 max-w-full object-contain" />
      )}
      <FormField label="Color" htmlFor="co-color">
        <div className="flex items-center gap-2.5">
          <ColorPopover label="Color de la empresa" value={form.color} colors={ORG_COLORS} onPick={(color) => setField('color', color)} />
          <span className="text-[12.5px] text-muted">{form.color ?? 'Sin color'}</span>
        </div>
      </FormField>
    </FormDrawer>
  );
}
