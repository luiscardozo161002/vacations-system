import { HttpClient } from '../core/http-client';
import { CrudResource } from '../core/crud-resource';
import type { ReviewAction, UserBranch } from './auth';
import type { AccountStatus, ListParams, OneOrMany } from '../types/common';

export type UserStatus = AccountStatus;

export interface User {
  user_id: number;
  employee_id: number | null;
  role_id: number;
  username: string;
  email: string;
  status: AccountStatus;
  review_actions: ReviewAction[];
  mfa_enabled: boolean;
  must_change_password: boolean;
  temporary_password_expires_at: string | null;
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
  role_id?: OneOrMany<number>;
  status?: OneOrMany<AccountStatus>;
  employee_id?: number;
}

export interface CreateUserInput {
  employee_id?: number | null;
  role_id: number;
  username: string;
  email: string;
  password: string;
  status?: AccountStatus;
  review_actions?: ReviewAction[];
}

export type UpdateUserInput = Partial<CreateUserInput>;

export type AssignedBranch = Omit<UserBranch, 'company_name'>;

export class UsersResource extends CrudResource<User, ListUsersParams, CreateUserInput, UpdateUserInput> {
  constructor(http: HttpClient) {
    super(http, '/users');
  }

  branches(userId: number): Promise<AssignedBranch[]> {
    return this.http.request<AssignedBranch[]>(`${this.path}/${userId}/branches`);
  }

  replaceBranches(userId: number, branchIds: number[]): Promise<AssignedBranch[]> {
    return this.http.request<AssignedBranch[]>(`${this.path}/${userId}/branches`, {
      method: 'PUT',
      body: { branch_ids: branchIds },
    });
  }
}
