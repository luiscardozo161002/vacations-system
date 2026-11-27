import { describe, expect, it } from 'vitest';
import { statusAction } from './status-action';

describe('statusAction', () => {
  it('el superusuario desactiva y activa; el resto solo elimina', () => {
    expect(statusAction(true, true).label).toBe('Desactivar');
    expect(statusAction(true, false).label).toBe('Activar');
    expect(statusAction(false, true).label).toBe('Eliminar');
  });
});
