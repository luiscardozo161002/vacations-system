import type { ReactNode } from 'react';

export const describedBy = (id: string, hint: ReactNode, error?: string) =>
  [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined;
