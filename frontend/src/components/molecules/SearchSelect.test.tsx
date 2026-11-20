import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { config } from '../../config';
import { SearchSelect } from './SearchSelect';

const options = [
  { value: '1', label: 'Administración' },
  { value: '2', label: 'Explotación' },
  { value: '3', label: 'Taller Mecánico' },
];

const onChange = vi.fn();

function Harness() {
  const [value, setValue] = useState('');
  return (
    <SearchSelect
      id="s-dept"
      options={options}
      value={value}
      onChange={(next) => {
        onChange(next);
        setValue(next);
      }}
      placeholder="Busca un departamento..."
    />
  );
}

const input = () => screen.getByRole('combobox') as HTMLInputElement;
const visibleLabels = () => screen.queryAllByRole('option').map((option) => option.textContent);

const type = (text: string) => {
  fireEvent.change(input(), { target: { value: text } });
  act(() => {
    vi.advanceTimersByTime(config.searchDelayMs);
  });
};

describe('SearchSelect', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    onChange.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('al enfocar muestra todas las opciones', () => {
    render(<Harness />);
    fireEvent.focus(input());

    expect(visibleLabels()).toEqual(['Administración', 'Explotación', 'Taller Mecánico']);
  });

  it('filtra al escribir, sin importar acentos ni mayúsculas, después de la espera', () => {
    render(<Harness />);
    fireEvent.focus(input());

    fireEvent.change(input(), { target: { value: 'EXPLOTACION' } });
    expect(visibleLabels()).toHaveLength(3);

    act(() => {
      vi.advanceTimersByTime(config.searchDelayMs);
    });
    expect(visibleLabels()).toEqual(['Explotación']);
  });

  it('solo se selecciona una opción de la lista', () => {
    render(<Harness />);
    fireEvent.focus(input());
    type('taller');

    fireEvent.click(screen.getByRole('option', { name: 'Taller Mecánico' }));

    expect(onChange).toHaveBeenCalledWith('3');
    expect(input().value).toBe('Taller Mecánico');
  });

  it('con el teclado elige la opción marcada con Enter', () => {
    render(<Harness />);
    fireEvent.focus(input());

    fireEvent.keyDown(input(), { key: 'ArrowDown' });
    fireEvent.keyDown(input(), { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith('2');
  });

  it('un texto que no es una opción no se guarda y al salir vuelve a lo elegido', () => {
    render(<Harness />);
    fireEvent.focus(input());
    fireEvent.click(screen.getByRole('option', { name: 'Administración' }));
    onChange.mockClear();

    type('zzz');
    expect(screen.getByText('Sin resultados.')).toBeTruthy();
    fireEvent.blur(input());

    expect(onChange).not.toHaveBeenCalled();
    expect(input().value).toBe('Administración');
  });

  it('al borrar el texto limpia la selección', () => {
    render(<Harness />);
    fireEvent.focus(input());
    fireEvent.click(screen.getByRole('option', { name: 'Administración' }));

    fireEvent.change(input(), { target: { value: '' } });

    expect(onChange).toHaveBeenLastCalledWith('');
  });
});
