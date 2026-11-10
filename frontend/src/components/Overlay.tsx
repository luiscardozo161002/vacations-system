import { useEffect, type ReactNode } from 'react';

interface OverlayProps {
  center?: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Overlay({ center = false, onClose, children }: OverlayProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className={`overlay${center ? ' center' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </div>
  );
}
