import { useState, type ReactNode } from 'react';
import { Button } from '../atoms/Button';
import { Drawer } from './Drawer';
import { ConfirmDialog } from './Dialog';
import { FieldError } from '../atoms/FieldText';

interface FormDrawerProps {
  title: string;
  submitLabel: string;
  submitting: boolean;
  error: string | null;
  submitDisabled?: boolean;
  readOnly?: boolean;
  noValidate?: boolean;
  confirm?: string;
  validate?: () => boolean;
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
  confirm,
  validate,
  onEdit,
  onClose,
  onSubmit,
  children,
}: FormDrawerProps) {
  const [confirming, setConfirming] = useState(false);

  const requestSubmit = () => {
    if (validate && !validate()) return;
    if (confirm) setConfirming(true);
    else onSubmit();
  };

  const confirmSubmit = () => {
    setConfirming(false);
    onSubmit();
  };

  return (
    <>
      <Drawer
        title={title}
        onClose={onClose}
        noValidate={noValidate}
        onSubmit={(event) => {
          event.preventDefault();
          if (!readOnly) requestSubmit();
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
      {confirming && (
        <ConfirmDialog
          title="Guardar cambios"
          message={confirm}
          confirmLabel="Guardar cambios"
          onConfirm={confirmSubmit}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
}
