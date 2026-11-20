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

    const form = screen.getByRole('dialog').querySelector('form')!;
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

  it('en solo lectura bloquea los campos y ofrece Editar en lugar de enviar', () => {
    const onEdit = vi.fn();
    const onSubmit = vi.fn();
    render(drawer({ readOnly: true, onEdit, onSubmit }));

    expect(screen.getByLabelText('Nombre').matches(':disabled')).toBe(true);
    expect(screen.queryByRole('button', { name: 'Crear turno' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    fireEvent.submit(screen.getByRole('dialog').querySelector('form')!);

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('con confirmación pregunta antes de enviar y no envía si se cancela', () => {
    const onSubmit = vi.fn();
    render(drawer({ confirm: '¿Guardar los cambios del turno?', onSubmit }));

    fireEvent.submit(screen.getByRole('dialog').querySelector('form')!);
    expect(screen.getByText('¿Guardar los cambios del turno?')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
    expect(screen.queryByText('¿Guardar los cambios del turno?')).toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.submit(screen.getByRole('dialog').querySelector('form')!);
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('no pregunta ni envía si la validación falla', () => {
    const onSubmit = vi.fn();
    render(drawer({ confirm: '¿Guardar?', validate: () => false, onSubmit }));

    fireEvent.submit(screen.getByRole('dialog').querySelector('form')!);

    expect(screen.queryByText('¿Guardar?')).toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('cierra con Cancelar', () => {
    const onClose = vi.fn();
    render(drawer({ onClose }));

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
