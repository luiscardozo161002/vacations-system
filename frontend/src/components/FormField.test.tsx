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
    expect(screen.getByText('Opcional').className).toBe('field-hint');
  });
});

describe('SelectField', () => {
  it('pinta las opciones y entrega el valor elegido', () => {
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

    fireEvent.change(screen.getByLabelText('Rol'), { target: { value: '3' } });

    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['Superusuario', 'Empleado']);
    expect(onChange).toHaveBeenCalledWith('3');
  });
});
