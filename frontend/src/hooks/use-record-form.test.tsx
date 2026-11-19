import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { toast } from 'sonner';
import { queryClient } from '../services/query-client';
import { useRecordForm } from './use-record-form';

vi.mock('sonner', () => ({ toast: vi.fn() }));

afterEach(() => {
  vi.mocked(toast).mockClear();
  vi.restoreAllMocks();
});

describe('useRecordForm', () => {
  it('abre un formulario nuevo y uno con un registro, y lo cierra', () => {
    const { result } = renderHook(() => useRecordForm<{ id: number }>());

    expect(result.current.isOpen).toBe(false);

    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);
    expect(result.current.record).toBeNull();

    act(() => result.current.open({ id: 7 }));
    expect(result.current.record).toEqual({ id: 7 });

    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
  });

  it('al guardar cierra, avisa y refresca los datos', () => {
    const refresh = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
    const { result } = renderHook(() => useRecordForm());

    act(() => result.current.open());
    act(() => result.current.saved('Empleado creado.'));

    expect(result.current.isOpen).toBe(false);
    expect(vi.mocked(toast).mock.calls[0][0]).toBe('Empleado creado.');
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
