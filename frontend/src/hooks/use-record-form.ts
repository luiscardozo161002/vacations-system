import { useState } from 'react';
import { useToast } from '../components/organisms/toast-context';
import { refreshData } from '../api/query-client';

export function useRecordForm<T = null>() {
  const showToast = useToast();
  const [form, setForm] = useState<{ record: T | null } | null>(null);

  const close = () => setForm(null);

  const saved = (message: string) => {
    close();
    showToast(message);
    refreshData();
  };

  return {
    isOpen: form !== null,
    record: form?.record ?? null,
    open: (record: T | null = null) => setForm({ record }),
    close,
    saved,
  };
}
