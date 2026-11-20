import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DatePicker } from './DatePicker';

describe('DatePicker', () => {
  it('muestra la fecha como dd/mm/aaaa y elige un día del calendario', () => {
    const onChange = vi.fn();
    render(<DatePicker id="d-start" value="2026-11-10" max="2026-11-19" onChange={onChange} />);

    expect(screen.getByRole('button', { name: /10\/11\/2026/ })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /10\/11\/2026/ }));
    fireEvent.click(screen.getByRole('button', { name: '5 de noviembre de 2026' }));

    expect(onChange).toHaveBeenCalledWith('2026-11-05');
    expect(screen.queryByRole('button', { name: '5 de noviembre de 2026' })).toBeNull();
  });

  it('no deja elegir días posteriores al máximo', () => {
    const onChange = vi.fn();
    render(<DatePicker id="d-start" value="2026-11-10" max="2026-11-19" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /10\/11\/2026/ }));

    expect((screen.getByRole('button', { name: '20 de noviembre de 2026' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: '19 de noviembre de 2026' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('muestra el texto de ayuda cuando no hay fecha', () => {
    render(<DatePicker id="d-start" value="" onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: /dd\/mm\/aaaa/ })).toBeTruthy();
  });
});
