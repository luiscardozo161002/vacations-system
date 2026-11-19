import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface OverlayProps {
  center?: boolean;
  onClose: () => void;
  children: ReactNode;
}

const focusablesIn = (element: HTMLElement) => [...element.querySelectorAll<HTMLElement>(FOCUSABLE)];

export function Overlay({ center = false, onClose, children }: OverlayProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const overlay = ref.current;
    if (overlay && !overlay.contains(document.activeElement)) {
      const body = overlay.querySelector<HTMLElement>('.drawer-body, .dialog-body');
      (focusablesIn(body ?? overlay)[0] ?? focusablesIn(overlay)[0] ?? overlay).focus();
    }
    return () => opener?.focus();
  }, []);

  const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
    }
    if (e.key !== 'Tab') return;
    const focusables = focusablesIn(e.currentTarget);
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      ref={ref}
      tabIndex={-1}
      className={`overlay${center ? ' center' : ''}`}
      onKeyDown={handleKey}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </div>
  );
}
