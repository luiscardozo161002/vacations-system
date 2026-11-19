import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SelectField, TextField } from './FormField';

describe('TextField', () => {
  it('liga la etiqueta al campo, entrega el valor y muestra la ayuda', () => {
    const onChange = vi.fn();
    render(
      <TextField id="t-email" label="Correo" type="email" value="" onChange={onChange} hint="Opcional" required />,
    );

    const input = screen.getByLabelText('Correo') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'a@b.com' } });

    expect(input.type).toBe('email');
    expect(input.required).toBe(true);
    expect(onChange).toHaveBeenCalledWith('a@b.com');
    expect(input.getAttribute('aria-describedby')).toBe('t-email-hint');
    expect(screen.getByText('Opcional').id).toBe('t-email-hint');
  });
});

describe('SelectField', () => {
  it('pinta las opciones y entrega el valor elegido', async () => {
    const onChange = vi.fn();
    render(
      <SelectField
        id="t-role"
        label="Rol"
        value="1"
        onChange={onChange}
        options={[
          { value: 1, label: 'Superusuario' },
          { value: 3, label: 'Empleado' },
        ]}
      />,
    );

    const trigger = screen.getByLabelText('Rol');
    expect(trigger.textContent).toContain('Superusuario');

    fireEvent.keyDown(trigger, { key: 'Enter' });

    const options = await screen.findAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual(['Superusuario', 'Empleado']);
    fireEvent.click(screen.getByRole('option', { name: 'Empleado' }));
    expect(onChange).toHaveBeenCalledWith('3');
  });
});
