import { sdk } from '../../../lib/sdk';
import { useCatalog } from '../../../lib/use-catalog';

export function useDepartments(enabled = true) {
  const { items, error } = useCatalog('departments', sdk.departments, {}, enabled);
  return { departments: items, error };
}
