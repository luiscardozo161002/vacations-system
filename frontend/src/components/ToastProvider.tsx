import { useCallback, useState, type ReactNode } from 'react';
import { Icon } from './Icon';
import { ToastContext } from './toast-context';

const TOAST_MS = 3200;

interface Toast {
  id: number;
  message: string;
}

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string) => {
    const id = nextId++;
    setToasts((current) => [...current, { id, message }]);
    setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), TOAST_MS);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div id="toast-stack" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast">
            <Icon name="check" />
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
