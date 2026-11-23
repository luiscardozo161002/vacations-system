import { HttpClient, SdkClientOptions } from './core/http-client';
import {
  AccrualRulesResource,
  AuditLogResource,
  AuthResource,
  BranchesResource,
  CalendarResource,
  CompaniesResource,
  DashboardResource,
  DepartmentsResource,
  EmployeesResource,
  HealthResource,
  NoticesResource,
  NotificationsResource,
  PermissionsResource,
  ReasonsResource,
  RolePermissionsResource,
  RolesResource,
  SettingsResource,
  ShiftsResource,
  UsersResource,
  VacationEntitlementsResource,
} from './resources';

export * from './core/http-client';
export * from './core/api-error';
export * from './core/api-resource';
export * from './core/crud-resource';
export * from './core/token-storage';
export * from './types/common';
export * from './resources';

export class VacationsSdk {
  readonly auth: AuthResource;
  readonly health: HealthResource;
  readonly employees: EmployeesResource;
  readonly departments: DepartmentsResource;
  readonly shifts: ShiftsResource;
  readonly companies: CompaniesResource;
  readonly branches: BranchesResource;
  readonly reasons: ReasonsResource;
  readonly notices: NoticesResource;
  readonly vacationEntitlements: VacationEntitlementsResource;
  readonly accrualRules: AccrualRulesResource;
  readonly users: UsersResource;
  readonly roles: RolesResource;
  readonly permissions: PermissionsResource;
  readonly rolePermissions: RolePermissionsResource;
  readonly auditLog: AuditLogResource;
  readonly calendar: CalendarResource;
  readonly dashboard: DashboardResource;
  readonly notifications: NotificationsResource;
  readonly settings: SettingsResource;

  constructor(options: SdkClientOptions) {
    const http = new HttpClient(options);
    this.auth = new AuthResource(http);
    this.health = new HealthResource(http);
    this.employees = new EmployeesResource(http);
    this.departments = new DepartmentsResource(http);
    this.shifts = new ShiftsResource(http);
    this.companies = new CompaniesResource(http);
    this.branches = new BranchesResource(http);
    this.reasons = new ReasonsResource(http);
    this.notices = new NoticesResource(http);
    this.vacationEntitlements = new VacationEntitlementsResource(http);
    this.accrualRules = new AccrualRulesResource(http);
    this.users = new UsersResource(http);
    this.roles = new RolesResource(http);
    this.permissions = new PermissionsResource(http);
    this.rolePermissions = new RolePermissionsResource(http);
    this.auditLog = new AuditLogResource(http);
    this.calendar = new CalendarResource(http);
    this.dashboard = new DashboardResource(http);
    this.notifications = new NotificationsResource(http);
    this.settings = new SettingsResource(http);
  }
}
