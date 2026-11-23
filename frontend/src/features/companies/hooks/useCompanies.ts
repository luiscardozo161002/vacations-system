import { sdk } from '../../../services/sdk';
import { useCatalog } from '../../../hooks/use-catalog';

export function useCompanies(enabled = true) {
  const { items, error } = useCatalog('companies', sdk.companies, { status: 'active' as const }, enabled);
  return { companies: items, error };
}
