import { useState } from 'react';
import type { EmployeeAccess } from '@vacations/sdk';
import { formatDate } from '../../../lib/format';
import { Dialog } from '../../../components/Dialog';

export interface GrantedAccess extends EmployeeAccess {
  employee_name: string;
}

interface AccessDialogProps {
  access: GrantedAccess;
  onClose: () => void;
}

export function AccessDialog({ access, onClose }: AccessDialogProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(access.temporary_password).catch(() => undefined);
    setCopied(true);
  };

  return (
    <Dialog
      title="Acceso del empleado"
      onClose={onClose}
      footer={
        <button type="button" className="btn btn-primary" onClick={copy} autoFocus>
          {copied ? 'Copiada' : 'Copiar contraseña'}
        </button>
      }
    >
      <p>
        Entrega a <strong>{access.employee_name}</strong> estos datos. Deberá cambiar la contraseña al entrar; si no lo hace antes
        del {formatDate(access.account.temporary_password_expires_at ?? '')}, vencerá y tendrás que reenviarle el acceso.
      </p>
      <div className="kv-grid" style={{ marginTop: 14 }}>
        <div className="kv-item">
          <div className="k">Correo</div>
          <div className="v">{access.account.email}</div>
        </div>
        <div className="kv-item">
          <div className="k">Usuario</div>
          <div className="v">{access.account.username}</div>
        </div>
        <div className="kv-item">
          <div className="k">Contraseña temporal</div>
          <div className="v" style={{ fontFamily: 'monospace', fontSize: 15, letterSpacing: 1 }}>
            {access.temporary_password}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
