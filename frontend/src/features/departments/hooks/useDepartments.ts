import { sdk } from '../../../api/sdk';
import { useCatalog } from '../../../hooks/use-catalog';

export function useDepartments(enabled = true) {
  const { items, error } = useCatalog('departments', sdk.departments, {}, enabled);
  return { departments: items, error };
}
