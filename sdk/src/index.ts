import { HttpClient, SdkClientOptions } from './core/http-client';
import { AuthResource } from './resources/auth';
import { HealthResource } from './resources/health';
import { EmployeesResource } from './resources/employees';
import { DepartmentsResource } from './resources/departments';
import { ShiftsResource } from './resources/shifts';

export * from './core/http-client';
export * from './core/api-error';
export * from './core/token-storage';
export * from './resources/auth';
export * from './types/common';
export * from './resources/health';
export * from './resources/employees';
export * from './resources/departments';
export * from './resources/shifts';


export class VacationsSdk {
  readonly auth: AuthResource;
  readonly health: HealthResource;
  readonly employees: EmployeesResource;
  readonly departments: DepartmentsResource;
  readonly shifts: ShiftsResource;

  constructor(options: SdkClientOptions) {
    const http = new HttpClient(options);
    this.auth = new AuthResource(http);
    this.health = new HealthResource(http);
    this.employees = new EmployeesResource(http);
    this.departments = new DepartmentsResource(http);
    this.shifts = new ShiftsResource(http);
  }
}
