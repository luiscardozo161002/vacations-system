import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DateRangePicker } from './DateRangePicker';

const range = (start: string, end: string, skipSaturdays = false) => ({ start, end, skipSaturdays });

const renderPicker = () => {
  const onChange = vi.fn();
  render(<DateRangePicker id="r-dates" value={range('2026-11-13', '2026-11-15')} onChange={onChange} />);
  fireEvent.click(screen.getByRole('button', { name: /Vie 13 nov/ }));
  return onChange;
};

const day = (number: number) => screen.getByRole('button', { name: `${number} de noviembre de 2026` });

describe('DateRangePicker', () => {
  it('resume el rango y cuántos días abarca', () => {
    render(<DateRangePicker id="r-dates" value={range('2026-11-13', '2026-11-15')} onChange={vi.fn()} />);

    const trigger = screen.getByRole('button', { name: /Vie 13 nov/ });
    expect(trigger.textContent).toContain('Vie 13 nov – Dom 15 nov');
    expect(trigger.textContent).toContain('3 días');
  });

  it('cuenta solo los días del turno y bloquea los descansos', () => {
    const onChange = vi.fn();
    render(
      <DateRangePicker
        id="r-dates"
        value={range('2026-11-13', '2026-11-17')}
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

    expect(onChange).toHaveBeenCalledWith(range('2026-11-18', '2026-11-20'));
  });

  it('el sábado viene deshabilitado y no se cuenta hasta habilitarlo para el empleado', () => {
    const onChange = vi.fn();
    render(
      <DateRangePicker
        id="r-dates"
        value={range('2026-11-20', '2026-11-24', true)}
        workingWeekdays={[1, 2, 3, 4, 5, 6]}
        onChange={onChange}
      />,
    );

    const trigger = screen.getByRole('button', { name: /Vie 20 nov/ });
    expect(trigger.textContent).toContain('3 días, sin sábado');

    fireEvent.click(trigger);
    expect((day(28) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Habilitar día sábado para este empleado' }));
    expect((day(28) as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getAllByText('4 días')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Aceptar' }));

    expect(onChange).toHaveBeenCalledWith(range('2026-11-20', '2026-11-24', false));
  });

  it('habilitar el sábado permite pedir solo ese día', () => {
    const onChange = vi.fn();
    render(
      <DateRangePicker
        id="r-dates"
        value={range('2026-11-20', '2026-11-20', true)}
        workingWeekdays={[1, 2, 3, 4, 5, 6]}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Vie 20 nov/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Habilitar día sábado para este empleado' }));
    fireEvent.click(day(21));
    fireEvent.click(day(21));
    fireEvent.click(screen.getByRole('button', { name: 'Aceptar' }));

    expect(onChange).toHaveBeenCalledWith(range('2026-11-21', '2026-11-21', false));
  });

  it('no ofrece habilitar el sábado si el turno no lo trabaja', () => {
    render(
      <DateRangePicker
        id="r-dates"
        value={range('2026-11-16', '2026-11-18', true)}
        workingWeekdays={[1, 2, 3, 4, 5]}
        onChange={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Lun 16 nov/ }));

    expect(screen.queryByRole('checkbox')).toBeNull();
  });

  it('elige el primer y el último día y los confirma con Aceptar', () => {
    const onChange = renderPicker();

    fireEvent.click(day(17));
    fireEvent.click(day(19));
    fireEvent.click(screen.getByRole('button', { name: 'Aceptar' }));

    expect(onChange).toHaveBeenCalledWith(range('2026-11-17', '2026-11-19'));
  });

  it('ordena las fechas si se elige primero la última', () => {
    const onChange = renderPicker();

    fireEvent.click(day(19));
    fireEvent.click(day(17));
    fireEvent.click(screen.getByRole('button', { name: 'Aceptar' }));

    expect(onChange).toHaveBeenCalledWith(range('2026-11-17', '2026-11-19'));
  });

  it('permite un solo día con un toque y Aceptar', () => {
    const onChange = renderPicker();

    fireEvent.click(day(17));
    expect(screen.getByText('1 día')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Aceptar' }));

    expect(onChange).toHaveBeenCalledWith(range('2026-11-17', '2026-11-17'));
  });

  it('descarta la selección si se cierra sin aceptar', () => {
    const onChange = renderPicker();

    fireEvent.click(day(17));
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });

    expect(onChange).not.toHaveBeenCalled();
  });
});
