import type { ReactNode } from 'react';
import { Button } from '../atoms/Button';
import { Drawer } from './Drawer';
import { FieldError } from '../atoms/FieldText';

interface FormDrawerProps {
  title: string;
  submitLabel: string;
  submitting: boolean;
  error: string | null;
  submitDisabled?: boolean;
  readOnly?: boolean;
  noValidate?: boolean;
  onEdit?: () => void;
  onClose: () => void;
  onSubmit: () => void;
  children: ReactNode;
}

export function FormDrawer({
  title,
  submitLabel,
  submitting,
  error,
  submitDisabled = false,
  readOnly = false,
  noValidate,
  onEdit,
  onClose,
  onSubmit,
  children,
}: FormDrawerProps) {
  return (
    <Drawer
      title={title}
      onClose={onClose}
      noValidate={noValidate}
      onSubmit={(event) => {
        event.preventDefault();
        if (!readOnly) onSubmit();
      }}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          {readOnly ? (
            <Button key="edit" onClick={onEdit}>
              Editar
            </Button>
          ) : (
            <Button key="submit" type="submit" disabled={submitting || submitDisabled}>
              {submitLabel}
            </Button>
          )}
        </>
      }
    >
      {error && <FieldError>{error}</FieldError>}
      <fieldset disabled={readOnly} className="m-0 min-w-0 border-0 p-0">
        {children}
      </fieldset>
    </Drawer>
  );
}
