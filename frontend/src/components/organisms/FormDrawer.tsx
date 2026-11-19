import type { ReactNode } from 'react';
import { Button } from '../atoms/Button';
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
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting || submitDisabled}>
            {submitLabel}
          </Button>
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
