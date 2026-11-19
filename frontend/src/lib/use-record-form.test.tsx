import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { ToastContext } from '../components/toast-context';
import { queryClient } from './query-client';
import { useRecordForm } from './use-record-form';

const toasts: string[] = [];

const wrapper = ({ children }: { children: ReactNode }) => (
  <ToastContext.Provider value={(message) => toasts.push(message)}>{children}</ToastContext.Provider>
);

afterEach(() => {
  toasts.length = 0;
  vi.restoreAllMocks();
});

describe('useRecordForm', () => {
  it('abre un formulario nuevo y uno con un registro, y lo cierra', () => {
    const { result } = renderHook(() => useRecordForm<{ id: number }>(), { wrapper });

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
    const { result } = renderHook(() => useRecordForm(), { wrapper });

    act(() => result.current.open());
    act(() => result.current.saved('Empleado creado.'));

    expect(result.current.isOpen).toBe(false);
    expect(toasts).toEqual(['Empleado creado.']);
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
