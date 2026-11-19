import { sdk } from '../../../lib/sdk';
import { useCatalog } from '../../../lib/use-catalog';

export function useShifts() {
  const { items, error } = useCatalog('shifts', sdk.shifts, {});
  return { shifts: items, error };
}
