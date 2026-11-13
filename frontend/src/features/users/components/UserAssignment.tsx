import { useState, type FormEvent } from 'react';
import type { Branch, Company, ReviewAction, User } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { getErrorMessage } from '../../../lib/get-error-message';
import { initials } from '../../../lib/format';
import { ROLE_LABELS } from '../../../app/navigation';
import { Drawer } from '../../../components/Drawer';
import { FormField } from '../../../components/FormField';

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
  SUPERUSER: 'El Superusuario ve todas las empresas y sedes.',
  EMPLOYEE: 'El Empleado solo ve su propia información.',
};

const checkboxRow = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 6 } as const;

const toggle = <T,>(list: T[], value: T): T[] => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);

export function UserAssignment({ user, branches, companies, onClose, onSaved }: UserAssignmentProps) {
  const [branchIds, setBranchIds] = useState<number[]>(() =>
    branches.filter((branch) => user.branch_codes.includes(branch.code)).map((branch) => branch.branch_id),
  );
  const [reviewActions, setReviewActions] = useState<ReviewAction[]>(user.review_actions);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isHr = user.role_code === 'USER';
  const name = user.employee_name ?? user.username;
  const companyIds = new Set(branches.filter((branch) => branchIds.includes(branch.branch_id)).map((branch) => branch.company_id));
  const companyNames = companies.filter((company) => companyIds.has(company.company_id)).map((company) => company.folio);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await sdk.users.replaceBranches(user.user_id, branchIds);
      await sdk.users.update(user.user_id, { review_actions: reviewActions });
      onSaved(`Asignación de ${name} actualizada.`);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      title="Asignación organizacional"
      onClose={onClose}
      onSubmit={isHr ? handleSubmit : undefined}
      footer={
        isHr ? (
          <>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              Guardar asignación
            </button>
          </>
        ) : (
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        )
      }
    >
      {formError && <p className="field-error">{formError}</p>}

      <div className="profile-head">
        <div className="avatar">{initials(name)}</div>
        <div>
          <h2 style={{ fontSize: 16 }}>{name}</h2>
          <p className="cell-sub">{ROLE_LABELS[user.role_code ?? ''] ?? user.role_code}</p>
        </div>
      </div>

      {!isHr ? (
        <p className="cell-sub">{ROLE_NOTES[user.role_code ?? ''] ?? ''}</p>
      ) : (
        <>
          <FormField label="Empresa">
            <input value={companyNames.join(', ') || 'Sin sedes asignadas'} disabled />
          </FormField>
          <FormField label="Sedes permitidas">
            {branches.map((branch) => (
              <label key={branch.branch_id} style={checkboxRow}>
                <input
                  type="checkbox"
                  checked={branchIds.includes(branch.branch_id)}
                  onChange={() => setBranchIds((prev) => toggle(prev, branch.branch_id))}
                />{' '}
                {branch.code} · {branch.branch_name}
              </label>
            ))}
          </FormField>
          <FormField label="Estados que puede revisar">
            {REVIEW_OPTIONS.map(([action, label]) => (
              <label key={action} style={checkboxRow}>
                <input
                  type="checkbox"
                  checked={reviewActions.includes(action)}
                  onChange={() => setReviewActions((prev) => toggle(prev, action))}
                />{' '}
                {label}
              </label>
            ))}
          </FormField>
        </>
      )}
    </Drawer>
  );
}
