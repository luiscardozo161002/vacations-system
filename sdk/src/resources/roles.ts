import { HttpClient } from '../core/http-client';
import { CrudResource } from '../core/crud-resource';
import type { ListParams, RecordStatus } from '../types/common';

export interface Role {
  role_id: number;
  role_code: string;
  description: string;
  status: RecordStatus;
}

export interface ListRolesParams extends ListParams {
  status?: RecordStatus;
}

export interface CreateRoleInput {
  role_code: string;
  description: string;
  status?: RecordStatus;
}

export type UpdateRoleInput = Partial<CreateRoleInput>;

export class RolesResource extends CrudResource<Role, ListRolesParams, CreateRoleInput, UpdateRoleInput> {
  constructor(http: HttpClient) {
    super(http, '/api/v1/roles');
  }
}
