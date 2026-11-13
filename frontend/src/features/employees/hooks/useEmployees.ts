import type { CallOptions, ListEmployeesParams } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { usePagedList } from '../../../lib/use-paged-list';

const listEmployees = (params: ListEmployeesParams, options: CallOptions) => sdk.employees.list(params, options);

export const useEmployees = (params: ListEmployeesParams) => usePagedList('employees', listEmployees, params);
