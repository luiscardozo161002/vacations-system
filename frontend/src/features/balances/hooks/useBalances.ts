import type { CallOptions, ListVacationEntitlementsParams } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { usePagedList } from '../../../lib/use-paged-list';

const listBalances = (params: ListVacationEntitlementsParams, options: CallOptions) =>
  sdk.vacationEntitlements.list(params, options);

export const useBalances = (params: ListVacationEntitlementsParams) => usePagedList('balances', listBalances, params);
