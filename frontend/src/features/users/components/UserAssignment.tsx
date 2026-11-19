import { useState, type FormEvent } from 'react';
import type { Branch, Company, ReviewAction, User } from '@vacations/sdk';
import { sdk } from '../../../services/sdk';
import { config } from '../../../config';
import { useFormSubmit } from '../../../hooks/use-form-submit';
import { initials } from '../../../utils/format';
import { ROLE_LABELS } from '../../../layouts/navigation';
import { Drawer } from '../../../components/organisms/Drawer';
import { FormField } from '../../../components/molecules/FormField';
import { CheckboxRow } from '../../../components/molecules/CheckboxRow';
import { Input } from '../../../components/atoms/Input';
import { Button } from '../../../components/atoms/Button';
import { Avatar } from '../../../components/atoms/Avatar';
import { FieldError } from '../../../components/atoms/FieldText';

interface UserAssignmentProps {
  user: User;
  branches: Branch[];
  companies: Company[];
  onClose: () => void;
  onSaved: (message: string) => void;
}

const REVIEW_OPTIONS: [ReviewAction, string][] = [
  ['approve', 'Aprobar'],
  ['reject', 'Rechazar'],
  ['cancel', 'Cancelar'],
];

const ROLE_NOTES: Record<string, string> = {
  [config.roles.global]: 'El Superusuario ve todas las empresas y sedes.',
  [config.roles.employee]: 'El Empleado solo ve su propia información.',
};

const toggle = <T,>(list: T[], value: T): T[] => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);

export function UserAssignment({ user, branches, companies, onClose, onSaved }: UserAssignmentProps) {
  const [branchIds, setBranchIds] = useState<number[]>(() =>
    branches.filter((branch) => user.branch_codes.includes(branch.code)).map((branch) => branch.branch_id),
  );
  const [reviewActions, setReviewActions] = useState<ReviewAction[]>(user.review_actions);
  const { submitting, error, submit } = useFormSubmit();

  const isHr = user.role_code === config.roles.scoped;
  const name = user.employee_name ?? user.username;
  const companyIds = new Set(branches.filter((branch) => branchIds.includes(branch.branch_id)).map((branch) => branch.company_id));
  const companyNames = companies.filter((company) => companyIds.has(company.company_id)).map((company) => company.folio);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(async () => {
      await sdk.users.replaceBranches(user.user_id, branchIds);
      await sdk.users.update(user.user_id, { review_actions: reviewActions });
      onSaved(`Asignación de ${name} actualizada.`);
    });
  };

  return (
    <Drawer
      title="Asignación organizacional"
      onClose={onClose}
      onSubmit={isHr ? handleSubmit : undefined}
      footer={
        isHr ? (
          <>
            <Button variant="secondary" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              Guardar asignación
            </Button>
          </>
        ) : (
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        )
      }
    >
      {error && <FieldError>{error}</FieldError>}

      <div className="mb-[18px] flex items-center gap-3.5">
        <Avatar size="lg">{initials(name)}</Avatar>
        <div>
          <h2 className="text-lg">{name}</h2>
          <p className="text-[12.5px] text-muted">{ROLE_LABELS[user.role_code ?? ''] ?? user.role_code}</p>
        </div>
      </div>

      {!isHr ? (
        <p className="text-[12.5px] text-muted">{ROLE_NOTES[user.role_code ?? ''] ?? ''}</p>
      ) : (
        <>
          <FormField label="Empresa">
            <Input value={companyNames.join(', ') || 'Sin sedes asignadas'} disabled />
          </FormField>
          <FormField label="Sedes permitidas">
            {branches.map((branch) => (
              <CheckboxRow
                key={branch.branch_id}
                checked={branchIds.includes(branch.branch_id)}
                onCheckedChange={() => setBranchIds((prev) => toggle(prev, branch.branch_id))}
              >
                {branch.code} · {branch.branch_name}
              </CheckboxRow>
            ))}
          </FormField>
          <FormField label="Estados que puede revisar">
            {REVIEW_OPTIONS.map(([action, label]) => (
              <CheckboxRow
                key={action}
                checked={reviewActions.includes(action)}
                onCheckedChange={() => setReviewActions((prev) => toggle(prev, action))}
              >
                {label}
              </CheckboxRow>
            ))}
          </FormField>
        </>
      )}
    </Drawer>
  );
}
