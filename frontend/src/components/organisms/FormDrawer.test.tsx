import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { FormDrawer } from './FormDrawer';

const drawer = (props: Partial<Parameters<typeof FormDrawer>[0]> = {}) => (
  <FormDrawer
    title="Nuevo turno"
    submitLabel="Crear turno"
    submitting={false}
    error={null}
    onClose={() => undefined}
    onSubmit={() => undefined}
    {...props}
  >
    <input aria-label="Nombre" />
  </FormDrawer>
);

describe('FormDrawer', () => {
  it('envía el formulario sin recargar la página', () => {
    const onSubmit = vi.fn();
    render(drawer({ onSubmit }));

    const form = screen.getByRole('dialog');
    const notPrevented = fireEvent.submit(form);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(notPrevented).toBe(false);
  });

  it('muestra el error arriba y el botón de envío con su etiqueta', () => {
    render(drawer({ error: 'Falta el nombre' }));

    expect(screen.getByRole('alert').textContent).toBe('Falta el nombre');
    expect(screen.getByRole('button', { name: 'Crear turno' })).toBeTruthy();
  });

  it('bloquea los botones mientras envía o cuando el envío está deshabilitado', () => {
    const { rerender } = render(drawer({ submitting: true }));
    expect((screen.getByRole('button', { name: 'Cancelar' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Crear turno' }) as HTMLButtonElement).disabled).toBe(true);

    rerender(drawer({ submitDisabled: true }));
    expect((screen.getByRole('button', { name: 'Cancelar' }) as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByRole('button', { name: 'Crear turno' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('cierra con Cancelar', () => {
    const onClose = vi.fn();
    render(drawer({ onClose }));

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
