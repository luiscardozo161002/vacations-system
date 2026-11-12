import type { CallOptions, ListNoticesParams } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { usePagedList } from '../../../lib/use-paged-list';

const listNotices = (params: ListNoticesParams, options: CallOptions) => sdk.notices.list(params, options);

export const useNotices = (params: ListNoticesParams) => usePagedList(listNotices, params);
