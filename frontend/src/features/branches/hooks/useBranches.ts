import { sdk } from '../../../services/sdk';
import { useCatalog } from '../../../hooks/use-catalog';

export function useBranches(enabled = true) {
  const { items, error } = useCatalog('branches', sdk.branches, { status: 'active' as const }, enabled);
  return { branches: items, error };
}
