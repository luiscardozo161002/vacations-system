import { sdk } from '../../../lib/sdk';
import { useCatalog } from '../../../lib/use-catalog';

export function useReasons() {
  const { items, error } = useCatalog('reasons', sdk.reasons, { status: 'active' as const });
  return { reasons: items, error };
}
