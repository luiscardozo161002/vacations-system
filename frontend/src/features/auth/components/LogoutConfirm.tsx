import { ConfirmDialog } from '../../../components/organisms/Dialog';

interface LogoutConfirmProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function LogoutConfirm({ onConfirm, onCancel }: LogoutConfirmProps) {
  return (
    <ConfirmDialog
      title="Cerrar sesión"
      message="¿Estás seguro de querer salir del sistema?"
      confirmLabel="Salir"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
