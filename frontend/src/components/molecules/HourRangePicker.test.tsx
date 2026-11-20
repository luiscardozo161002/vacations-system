import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { HourRangePicker } from './HourRangePicker';

const renderPicker = (workHours = { start: '07:00', end: '16:00' }) => {
  const onChange = vi.fn();
  render(<HourRangePicker id="h-range" value={{ start: '07:00', end: '08:00' }} workHours={workHours} onChange={onChange} />);
  fireEvent.click(screen.getByRole('button', { name: /07:00 – 08:00/ }));
  return onChange;
};

const mark = (time: string) => screen.getByRole('button', { name: time });

describe('HourRangePicker', () => {
  it('resume el horario y su duración', () => {
    render(<HourRangePicker id="h-range" value={{ start: '12:00', end: '14:00' }} workHours={{ start: '07:00', end: '16:00' }} onChange={vi.fn()} />);

    const trigger = screen.getByRole('button', { name: /12:00 – 14:00/ });
    expect(trigger.textContent).toContain('2 h');
  });

  it('ofrece solo las horas del turno, incluida la de salida', () => {
    renderPicker({ start: '07:00', end: '15:00' });

    const marks = screen.getAllByRole('button').map((button) => button.textContent).filter((text) => /^\d{2}:\d{2}$/.test(text ?? ''));
    expect(marks).toEqual(['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00']);
  });

  it('elige inicio y fin y los confirma con Aceptar', () => {
    const onChange = renderPicker();

    fireEvent.click(mark('14:00'));
    expect((screen.getByRole('button', { name: 'Aceptar' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(mark('16:00'));
    expect(screen.getByText('2 h', { selector: 'div' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Aceptar' }));

    expect(onChange).toHaveBeenCalledWith({ start: '14:00', end: '16:00' });
  });

  it('ordena las horas si se elige primero la última', () => {
    const onChange = renderPicker();

    fireEvent.click(mark('12:00'));
    fireEvent.click(mark('10:00'));
    fireEvent.click(screen.getByRole('button', { name: 'Aceptar' }));

    expect(onChange).toHaveBeenCalledWith({ start: '10:00', end: '12:00' });
  });

  it('no cambia nada si se cierra sin aceptar', () => {
    const onChange = renderPicker();

    fireEvent.click(mark('12:00'));
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });

    expect(onChange).not.toHaveBeenCalled();
  });
});
