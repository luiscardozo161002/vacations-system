export interface StatusAction {
  label: string;
  done: string;
  icon: string;
}

const REMOVE: StatusAction = { label: 'Eliminar', done: 'Se eliminó', icon: 'trash-2' };
const DEACTIVATE: StatusAction = { label: 'Desactivar', done: 'Se desactivó', icon: 'user-x' };
const ACTIVATE: StatusAction = { label: 'Activar', done: 'Se activó', icon: 'user-check' };

export const statusAction = (isGlobal: boolean, active: boolean): StatusAction => {
  if (!isGlobal) return REMOVE;
  return active ? DEACTIVATE : ACTIVATE;
};
