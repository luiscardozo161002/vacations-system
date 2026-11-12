import { HttpClient } from '../core/http-client';
import { CrudResource } from '../core/crud-resource';
import type { ReviewAction, UserBranch } from './auth';
import type { ListParams } from '../types/common';

export type UserStatus = 'active' | 'inactive' | 'locked';

export interface User {
  user_id: number;
  employee_id: number | null;
  role_id: number;
  username: string;
  email: string;
  status: UserStatus;
  review_actions: ReviewAction[];
  mfa_enabled: boolean;
  failed_login_attempts: number;
  locked_until: string | null;
  last_login_at: string | null;
  last_login_ip: string | null;
  created_at: string;
  updated_at: string;
  role_code: string | null;
  employee_name: string | null;
  branch_codes: string[];
}

export interface ListUsersParams extends ListParams {
  role_id?: number;
  status?: UserStatus;
  employee_id?: number;
}

export interface CreateUserInput {
  employee_id?: number | null;
  role_id: number;
  username: string;
  email: string;
  password: string;
  status?: UserStatus;
  review_actions?: ReviewAction[];
}

export type UpdateUserInput = Partial<CreateUserInput>;

export type AssignedBranch = Omit<UserBranch, 'company_name'>;

export class UsersResource extends CrudResource<User, ListUsersParams, CreateUserInput, UpdateUserInput> {
  constructor(http: HttpClient) {
    super(http, '/api/v1/users');
  }

  branches(userId: number): Promise<AssignedBranch[]> {
    return this.http.request<AssignedBranch[]>(`${this.path}/${userId}/branches`, { method: 'GET' });
  }

  replaceBranches(userId: number, branchIds: number[]): Promise<AssignedBranch[]> {
    return this.http.request<AssignedBranch[]>(`${this.path}/${userId}/branches`, {
      method: 'PUT',
      body: { branch_ids: branchIds },
    });
  }
}
