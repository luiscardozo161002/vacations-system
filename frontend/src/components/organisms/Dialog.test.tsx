import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ConfirmDialog, Dialog } from './Dialog';

function Opener({ onInnerClose = () => {} }: { onInnerClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Abrir
      </button>
      {open && (
        <Dialog title="Detalle" onClose={() => setOpen(false)}>
          <input aria-label="Nombre" />
          <button type="button" onClick={() => setConfirming(true)}>
            Borrar
          </button>
          {confirming && (
            <ConfirmDialog
              title="¿Seguro?"
              message="No se puede deshacer."
              onConfirm={() => setConfirming(false)}
              onCancel={() => {
                onInnerClose();
                setConfirming(false);
              }}
            />
          )}
        </Dialog>
      )}
    </>
  );
}

describe('Dialog', () => {
  it('lleva el foco al primer campo y lo regresa al botón que lo abrió', () => {
    render(<Opener />);
    const opener = screen.getByText('Abrir');
    opener.focus();
    fireEvent.click(opener);

    expect(document.activeElement).toBe(screen.getByLabelText('Nombre'));

    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it('mantiene el tabulador dentro del diálogo', () => {
    render(<Opener />);
    fireEvent.click(screen.getByText('Abrir'));
    const last = screen.getByText('Borrar');
    last.focus();

    fireEvent.keyDown(last, { key: 'Tab' });
    expect(document.activeElement).toBe(screen.getByTitle('Cerrar'));

    fireEvent.keyDown(document.activeElement!, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it('Escape cierra solo el diálogo de encima', () => {
    const onInnerClose = vi.fn();
    render(<Opener onInnerClose={onInnerClose} />);
    fireEvent.click(screen.getByText('Abrir'));
    fireEvent.click(screen.getByText('Borrar'));

    expect(document.activeElement).toBe(screen.getByText('Confirmar'));

    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });

    expect(onInnerClose).toHaveBeenCalledOnce();
    expect(screen.getByRole('dialog', { name: 'Detalle' })).toBeTruthy();
    expect(screen.queryByRole('dialog', { name: '¿Seguro?' })).toBeNull();
  });
});
