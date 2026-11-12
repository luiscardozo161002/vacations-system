import { HttpClient } from '../core/http-client';
import { CrudResource } from '../core/crud-resource';
import type { ListParams, RecordStatus } from '../types/common';

export interface Permission {
  permission_id: number;
  permission_code: string;
  description: string;
  status: RecordStatus;
}

export interface ListPermissionsParams extends ListParams {
  status?: RecordStatus;
}

export interface CreatePermissionInput {
  permission_code: string;
  description: string;
  status?: RecordStatus;
}

export type UpdatePermissionInput = Partial<CreatePermissionInput>;

export class PermissionsResource extends CrudResource<
  Permission,
  ListPermissionsParams,
  CreatePermissionInput,
  UpdatePermissionInput
> {
  constructor(http: HttpClient) {
    super(http, '/api/v1/permissions');
  }
}
