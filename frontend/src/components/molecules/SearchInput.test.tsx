import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { SearchInput } from './SearchInput';

describe('SearchInput', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('espera a que se deje de escribir y entrega el texto sin espacios', () => {
    const onSearch = vi.fn();
    render(<SearchInput value="" onSearch={onSearch} placeholder="Buscar..." />);
    const input = screen.getByPlaceholderText('Buscar...');

    fireEvent.change(input, { target: { value: 'ga' } });
    act(() => vi.advanceTimersByTime(200));
    fireEvent.change(input, { target: { value: ' garcia ' } });
    act(() => vi.advanceTimersByTime(200));
    expect(onSearch).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(100));
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('garcia');
  });

  it('no busca si el texto ya es el filtro actual', () => {
    const onSearch = vi.fn();
    render(<SearchInput value="ra" onSearch={onSearch} placeholder="Buscar..." />);

    act(() => vi.advanceTimersByTime(1000));

    expect((screen.getByPlaceholderText('Buscar...') as HTMLInputElement).value).toBe('ra');
    expect(onSearch).not.toHaveBeenCalled();
  });
});
