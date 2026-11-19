import type { ReactNode } from 'react';
import { Button } from '../atoms/Button';
import { Modal, ModalBody, ModalFooter, ModalHeader } from './Modal';

interface DialogProps {
  title: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
}

export function Dialog({ title, onClose, footer, children }: DialogProps) {
  return (
    <Modal
      onClose={onClose}
      className="top-1/2 left-1/2 max-h-[90vh] w-[calc(100%-40px)] max-w-[440px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg shadow-md"
    >
      <ModalHeader title={title} />
      <ModalBody>{children}</ModalBody>
      {footer && <ModalFooter>{footer}</ModalFooter>}
    </Modal>
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
        <Button onClick={onConfirm} data-autofocus>
          {confirmLabel}
        </Button>
      }
    >
      <p>{message}</p>
    </Dialog>
  );
}
