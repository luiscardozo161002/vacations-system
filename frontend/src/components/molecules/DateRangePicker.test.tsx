import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DateRangePicker } from './DateRangePicker';

const renderPicker = () => {
  const onChange = vi.fn();
  render(<DateRangePicker id="r-dates" value={{ start: '2026-11-13', end: '2026-11-15' }} onChange={onChange} />);
  fireEvent.click(screen.getByRole('button', { name: /Vie 13 nov/ }));
  return onChange;
};

const day = (number: number) => screen.getByRole('button', { name: `${number} de noviembre de 2026` });

describe('DateRangePicker', () => {
  it('resume el rango y cuántos días abarca', () => {
    render(<DateRangePicker id="r-dates" value={{ start: '2026-11-13', end: '2026-11-15' }} onChange={vi.fn()} />);

    const trigger = screen.getByRole('button', { name: /Vie 13 nov/ });
    expect(trigger.textContent).toContain('Vie 13 nov – Dom 15 nov');
    expect(trigger.textContent).toContain('3 días');
  });

  it('cuenta solo los días del turno y bloquea los descansos', () => {
    const onChange = vi.fn();
    render(
      <DateRangePicker
        id="r-dates"
        value={{ start: '2026-11-13', end: '2026-11-17' }}
        workingWeekdays={[1, 2, 3, 4, 5]}
        onChange={onChange}
      />,
    );

    const trigger = screen.getByRole('button', { name: /Vie 13 nov/ });
    expect(trigger.textContent).toContain('3 días');

    fireEvent.click(trigger);

    expect((day(14) as HTMLButtonElement).disabled).toBe(true);
    expect((day(15) as HTMLButtonElement).disabled).toBe(true);
    expect((day(16) as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByText(/días en rojo son descanso/)).toBeTruthy();

    fireEvent.click(day(18));
    fireEvent.click(day(20));
    expect(screen.getAllByText('3 días')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Aceptar' }));

    expect(onChange).toHaveBeenCalledWith({ start: '2026-11-18', end: '2026-11-20' });
  });

  it('elige el primer y el último día y los confirma con Aceptar', () => {
    const onChange = renderPicker();

    fireEvent.click(day(17));
    fireEvent.click(day(19));
    fireEvent.click(screen.getByRole('button', { name: 'Aceptar' }));

    expect(onChange).toHaveBeenCalledWith({ start: '2026-11-17', end: '2026-11-19' });
  });

  it('ordena las fechas si se elige primero la última', () => {
    const onChange = renderPicker();

    fireEvent.click(day(19));
    fireEvent.click(day(17));
    fireEvent.click(screen.getByRole('button', { name: 'Aceptar' }));

    expect(onChange).toHaveBeenCalledWith({ start: '2026-11-17', end: '2026-11-19' });
  });

  it('permite un solo día con un toque y Aceptar', () => {
    const onChange = renderPicker();

    fireEvent.click(day(17));
    expect(screen.getByText('1 día')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Aceptar' }));

    expect(onChange).toHaveBeenCalledWith({ start: '2026-11-17', end: '2026-11-17' });
  });

  it('descarta la selección si se cierra sin aceptar', () => {
    const onChange = renderPicker();

    fireEvent.click(day(17));
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });

    expect(onChange).not.toHaveBeenCalled();
  });
});
