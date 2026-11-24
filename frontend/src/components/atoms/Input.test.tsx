import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Input } from './Input';

describe('Input con contraseña', () => {
  it('oculta la contraseña y la muestra con el ojito', () => {
    render(<Input type="password" aria-label="Contraseña" defaultValue="secreta123" />);
    const input = screen.getByLabelText('Contraseña') as HTMLInputElement;

    expect(input.type).toBe('password');

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(input.type).toBe('text');
    expect(input.value).toBe('secreta123');

    fireEvent.click(screen.getByRole('button', { name: 'Ocultar contraseña' }));
    expect(input.type).toBe('password');
  });

  it('el ojito no envía el formulario', () => {
    let submitted = false;
    render(
      <form onSubmit={(e) => { e.preventDefault(); submitted = true; }}>
        <Input type="password" aria-label="Contraseña" />
      </form>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));

    expect(submitted).toBe(false);
  });

  it('un campo normal no lleva ojito', () => {
    render(<Input type="email" aria-label="Correo" />);

    expect(screen.queryByRole('button')).toBeNull();
  });
});
