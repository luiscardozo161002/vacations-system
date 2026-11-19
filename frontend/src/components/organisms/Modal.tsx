import { useState, type ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '../../utils/cn';
import { Icon } from '../atoms/Icon';
import { IconButton } from '../atoms/IconButton';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const focusFirstField = (event: Event) => {
  event.preventDefault();
  const content = event.currentTarget as HTMLElement;
  const body = content.querySelector<HTMLElement>('[data-modal-body]');
  const target =
    content.querySelector<HTMLElement>('[data-autofocus]') ??
    body?.querySelector<HTMLElement>(FOCUSABLE) ??
    content.querySelector<HTMLElement>(FOCUSABLE) ??
    content;
  target.focus();
};

interface ModalProps {
  onClose: () => void;
  className: string;
  children: ReactNode;
}

export function Modal({ onClose, className, children }: ModalProps) {
  const container = document.getElementById('app-shell') ?? undefined;
  const [opener] = useState(() => document.activeElement as HTMLElement | null);

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal container={container}>
        <DialogPrimitive.Overlay className="absolute inset-0 z-40 bg-[rgba(15,23,42,0.4)]" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onOpenAutoFocus={focusFirstField}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            opener?.focus();
          }}
          className={cn('absolute z-40 bg-surface focus:outline-none', className)}
        >
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function ModalHeader({ title }: { title: string }) {
  return (
    <div className="flex items-start justify-between border-b border-line px-5 py-[18px]">
      <DialogPrimitive.Title className="text-[21px] font-semibold text-fg">{title}</DialogPrimitive.Title>
      <DialogPrimitive.Close asChild>
        <IconButton title="Cerrar">
          <Icon name="x" />
        </IconButton>
      </DialogPrimitive.Close>
    </div>
  );
}

export function ModalBody({ children }: { children: ReactNode }) {
  return (
    <div data-modal-body className="flex-1 p-5">
      {children}
    </div>
  );
}

export function ModalFooter({ children }: { children: ReactNode }) {
  return <div className="flex justify-end gap-2.5 border-t border-line px-5 py-4">{children}</div>;
}
