import type { FormEvent, ReactNode } from 'react';
import { Modal, ModalBody, ModalFooter, ModalHeader } from './Modal';

interface DrawerProps {
  title: string;
  onClose: () => void;
  onSubmit?: (e: FormEvent) => void;
  footer?: ReactNode;
  children: ReactNode;
}

const PANEL = 'flex h-full flex-col overflow-y-auto';

export function Drawer({ title, onClose, onSubmit, footer, children }: DrawerProps) {
  const content = (
    <>
      <ModalHeader title={title} />
      <ModalBody>{children}</ModalBody>
      {footer && <ModalFooter>{footer}</ModalFooter>}
    </>
  );

  return (
    <Modal
      onClose={onClose}
      className="top-0 right-0 h-full w-full max-w-[420px] shadow-[-8px_0_24px_rgba(15,23,42,0.12)]"
    >
      {onSubmit ? (
        <form className={PANEL} onSubmit={onSubmit}>
          {content}
        </form>
      ) : (
        <div className={PANEL}>{content}</div>
      )}
    </Modal>
  );
}
