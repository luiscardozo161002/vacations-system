import { HttpClient } from '../core/http-client';
import { CallOptions, toQuery } from '../core/crud-resource';
import type { ListParams, Paginated, RecordStatus } from '../types/common';

export interface RolePermission {
  role_id: number;
  permission_id: number;
  status: RecordStatus;
}

export interface ListRolePermissionsParams extends ListParams {
  role_id?: number;
  permission_id?: number;
  status?: RecordStatus;
}

export interface CreateRolePermissionInput {
  role_id: number;
  permission_id: number;
}

const PATH = '/api/v1/role-permissions';

export class RolePermissionsResource {
  constructor(private readonly http: HttpClient) {}

  list(params?: ListRolePermissionsParams, options: CallOptions = {}): Promise<Paginated<RolePermission>> {
    return this.http.request<Paginated<RolePermission>>(PATH, {
      method: 'GET',
      query: toQuery(params),
      signal: options.signal,
    });
  }

  get(roleId: number, permissionId: number, options: CallOptions = {}): Promise<RolePermission> {
    return this.http.request<RolePermission>(`${PATH}/${roleId}/${permissionId}`, {
      method: 'GET',
      signal: options.signal,
    });
  }

  create(input: CreateRolePermissionInput): Promise<RolePermission> {
    return this.http.request<RolePermission>(PATH, { method: 'POST', body: input });
  }

  remove(roleId: number, permissionId: number): Promise<void> {
    return this.http.request<void>(`${PATH}/${roleId}/${permissionId}`, { method: 'DELETE' });
  }
}
