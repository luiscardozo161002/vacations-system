import { sdk } from '../../../api/sdk';
import { useCatalog } from '../../../hooks/use-catalog';

export function useReasons() {
  const { items, error } = useCatalog('reasons', sdk.reasons, { status: 'active' as const });
  return { reasons: items, error };
}
