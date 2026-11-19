import { useState } from 'react';
import type { EmployeeAccess } from '@vacations/sdk';
import { formatDate } from '../../../utils/format';
import { Dialog } from '../../../components/organisms/Dialog';
import { Button } from '../../../components/atoms/Button';
import { KeyValue, KeyValueGrid } from '../../../components/molecules/KeyValue';

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
        <Button onClick={copy} data-autofocus>
          {copied ? 'Copiada' : 'Copiar contraseña'}
        </Button>
      }
    >
      <p>
        Entrega a <strong>{access.employee_name}</strong> estos datos. Deberá cambiar la contraseña al entrar; si no lo hace antes
        del {formatDate(access.account.temporary_password_expires_at ?? '')}, vencerá y tendrás que reenviarle el acceso.
      </p>
      <KeyValueGrid className="mt-3.5">
        <KeyValue label="Correo">{access.account.email}</KeyValue>
        <KeyValue label="Usuario">{access.account.username}</KeyValue>
        <KeyValue label="Contraseña temporal" valueClassName="font-mono text-[15px] tracking-[1px]">{access.temporary_password}</KeyValue>
      </KeyValueGrid>
    </Dialog>
  );
}
