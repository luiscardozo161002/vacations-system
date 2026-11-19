import type { ReactNode } from 'react';
import { Icon } from '../atoms/Icon';
import { Overlay } from './Overlay';
import { IconButton } from '../atoms/IconButton';
import { Button } from '../atoms/Button';

interface DialogProps {
  title: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
}

export function Dialog({ title, onClose, footer, children }: DialogProps) {
  return (
    <Overlay center onClose={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label={title}>
        <div className="dialog-head">
          <h2>{title}</h2>
          <IconButton title="Cerrar" onClick={onClose}>
            <Icon name="x" />
          </IconButton>
        </div>
        <div className="dialog-body">{children}</div>
        {footer && <div className="dialog-foot">{footer}</div>}
      </div>
    </Overlay>
  );
}

interface ConfirmDialogProps {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, message, confirmLabel = 'Confirmar', onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Dialog
      title={title}
      onClose={onCancel}
      footer={
        <Button onClick={onConfirm} autoFocus>
          {confirmLabel}
        </Button>
      }
    >
      <p>{message}</p>
    </Dialog>
  );
}
