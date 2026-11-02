import { HttpClient, SdkClientOptions } from './http-client';
import { HealthResource } from './resources/health';
import { EmployeesResource } from './resources/employees';
import { DepartmentsResource } from './resources/departments';
import { ShiftsResource } from './resources/shifts';

export * from './http-client';
export * from './resources/health';
export * from './resources/employees';
export * from './resources/departments';
export * from './resources/shifts';

/**
 * SDK del sistema de vacaciones, organizado por recursos:
 *   const sdk = new VacationsSdk({ baseUrl: "http://localhost:3000" });
 *   const health = await sdk.health.check();
 *   const employees = await sdk.employees.list({ status: "active" });
 *
 * A futuro se agregan aqui mas recursos (notices, vacations...)
 * siguiendo el mismo patron que HealthResource/EmployeesResource.
 */
export class VacationsSdk {
  readonly health: HealthResource;
  readonly employees: EmployeesResource;
  readonly departments: DepartmentsResource;
  readonly shifts: ShiftsResource;

  constructor(options: SdkClientOptions) {
    const http = new HttpClient(options);
    this.health = new HealthResource(http);
    this.employees = new EmployeesResource(http);
    this.departments = new DepartmentsResource(http);
    this.shifts = new ShiftsResource(http);
  }
}
