import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { SdkHttpError } from '@vacations/sdk';
import { useFormSubmit } from './use-form-submit';

describe('useFormSubmit', () => {
  it('ejecuta la acción y deja el formulario sin error', async () => {
    const { result } = renderHook(() => useFormSubmit());
    let ran = false;

    await act(() =>
      result.current.submit(async () => {
        ran = true;
      }),
    );

    expect(ran).toBe(true);
    expect(result.current.submitting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('muestra el mensaje de la API cuando la acción falla', async () => {
    const { result } = renderHook(() => useFormSubmit());

    await act(() =>
      result.current.submit(async () => {
        throw new SdkHttpError(409, { error: { code: 'DUPLICATE', message: 'Ese correo ya está en uso' } });
      }),
    );

    expect(result.current.error).toBe('Ese correo ya está en uso');
    expect(result.current.submitting).toBe(false);
  });

  it('usa un mensaje genérico con un error que no viene de la API y lo limpia al reintentar', async () => {
    const { result } = renderHook(() => useFormSubmit());

    await act(() =>
      result.current.submit(async () => {
        throw new Error('red caída');
      }),
    );
    expect(result.current.error).toMatch(/No se pudo conectar/);

    await act(() => result.current.submit(async () => undefined));
    expect(result.current.error).toBeNull();
  });

  it('permite mostrar un error de validación', () => {
    const { result } = renderHook(() => useFormSubmit());

    act(() => result.current.setError('Falta el nombre'));

    expect(result.current.error).toBe('Falta el nombre');
  });
});
