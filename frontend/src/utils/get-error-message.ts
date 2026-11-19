import { SdkHttpError } from '@vacations/sdk';

export const getErrorMessage = (err: unknown): string => {
  if (err instanceof SdkHttpError) return err.message;
  return 'No se pudo conectar con el servidor. Intenta de nuevo.';
};
