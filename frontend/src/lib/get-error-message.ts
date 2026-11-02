import { SdkHttpError } from '@vacations/sdk';

/**
 * El backend ya manda mensajes listos para el usuario (ver backend/src/lib/error-handler.js),
 * y SdkHttpError los expone directo en .message. Para un error que no vino del backend
 * (red caida, servidor no disponible) usamos un mensaje generico.
 */
export const getErrorMessage = (err: unknown): string => {
  if (err instanceof SdkHttpError) return err.message;
  return 'No se pudo conectar con el servidor. Intenta de nuevo.';
};
