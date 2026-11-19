import { sdk } from '../../../services/sdk';
import { useCatalog } from '../../../hooks/use-catalog';

export function useShifts() {
  const { items, error } = useCatalog('shifts', sdk.shifts, {});
  return { shifts: items, error };
}
