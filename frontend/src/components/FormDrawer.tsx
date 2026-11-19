import type { ReactNode } from 'react';
import { Drawer } from './Drawer';

interface FormDrawerProps {
  title: string;
  submitLabel: string;
  submitting: boolean;
  error: string | null;
  submitDisabled?: boolean;
  onClose: () => void;
  onSubmit: () => void;
  children: ReactNode;
}

export function FormDrawer({ title, submitLabel, submitting, error, submitDisabled = false, onClose, onSubmit, children }: FormDrawerProps) {
  return (
    <Drawer
      title={title}
      onClose={onClose}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting || submitDisabled}>
            {submitLabel}
          </button>
        </>
      }
    >
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      {children}
    </Drawer>
  );
}
