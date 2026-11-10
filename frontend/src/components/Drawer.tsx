import type { FormEvent, ReactNode } from 'react';
import { Icon } from './Icon';
import { Overlay } from './Overlay';

interface DrawerProps {
  title: string;
  onClose: () => void;
  onSubmit?: (e: FormEvent) => void;
  footer?: ReactNode;
  children: ReactNode;
}

export function Drawer({ title, onClose, onSubmit, footer, children }: DrawerProps) {
  const content = (
    <>
      <div className="drawer-head">
        <h2>{title}</h2>
        <button type="button" className="icon-btn" title="Cerrar" onClick={onClose}>
          <Icon name="x" />
        </button>
      </div>
      <div className="drawer-body">{children}</div>
      {footer && <div className="drawer-foot">{footer}</div>}
    </>
  );

  return (
    <Overlay onClose={onClose}>
      {onSubmit ? (
        <form className="drawer" role="dialog" aria-modal="true" aria-label={title} onSubmit={onSubmit}>
          {content}
        </form>
      ) : (
        <div className="drawer" role="dialog" aria-modal="true" aria-label={title}>
          {content}
        </div>
      )}
    </Overlay>
  );
}
