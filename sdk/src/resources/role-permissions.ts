import { ApiResource, CallOptions } from '../core/api-resource';
import type { HttpClient } from '../core/http-client';
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

export class RolePermissionsResource extends ApiResource {
  constructor(http: HttpClient) {
    super(http, '/role-permissions');
  }

  list(params?: ListRolePermissionsParams, options: CallOptions = {}): Promise<Paginated<RolePermission>> {
    return this.http.request<Paginated<RolePermission>>(this.path, { query: params, signal: options.signal });
  }

  get(roleId: number, permissionId: number, options: CallOptions = {}): Promise<RolePermission> {
    return this.http.request<RolePermission>(`${this.path}/${roleId}/${permissionId}`, { signal: options.signal });
  }

  create(input: CreateRolePermissionInput): Promise<RolePermission> {
    return this.http.request<RolePermission>(this.path, { method: 'POST', body: input });
  }

  remove(roleId: number, permissionId: number): Promise<void> {
    return this.http.request<void>(`${this.path}/${roleId}/${permissionId}`, { method: 'DELETE' });
  }
}
