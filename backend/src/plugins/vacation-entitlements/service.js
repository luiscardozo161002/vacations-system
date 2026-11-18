const CrudService = require('../../lib/crud/crud-service');
const repository = require('./repository');
const { AppError } = require('../../lib/app-error');
const { EDITABLE_FIELDS } = require('./fields');
const employeeDetails = require('../../lib/employee-details');
const { toTotalHours, splitHours } = require('../../lib/balance');

const DEFAULT_DAILY_HOURS = 8;

class VacationEntitlementService extends CrudService {
  async list(filters, scope) {
    const page = await super.list(filters, scope);
    return { ...page, data: await this.describeAll(page.data) };
  }

  async findById(id, scope) {
    return this.describe(await super.findById(id, scope));
  }

  async create(data, scope) {
    await this.checkReferences(data, scope);
    return this.describe(await super.create(data, scope));
  }

  async update(id, data, scope) {
    await this.checkReferences(data, scope);
    return this.describe(await super.update(id, data, scope));
  }

  async checkReferences(data, scope) {
    if (data.employee_id !== undefined && !(await scope.allowsEmployee(data.employee_id))) {
      throw new AppError('INVALID_EMPLOYEE', 'El empleado no existe');
    }
  }

  async describe(entitlement) {
    return (await this.describeAll([entitlement]))[0];
  }

  async describeAll(entitlements) {
    const employees = await employeeDetails.find(entitlements.map((entitlement) => entitlement.employee_id));

    return entitlements.map((entitlement) => {
      const { daily_hours: dailyHours, ...employee } = employees.get(entitlement.employee_id) ?? {
        daily_hours: DEFAULT_DAILY_HOURS,
      };
      const used = toTotalHours(entitlement.used_days, entitlement.used_hours, dailyHours);
      return {
        ...entitlement,
        employee_name: employee.employee_name ?? null,
        employee_number: employee.employee_number ?? null,
        department_name: employee.department_name ?? null,
        daily_hours: dailyHours,
        available: splitHours(Math.max(0, entitlement.total_days * dailyHours - used), dailyHours),
      };
    });
  }
}

module.exports = new VacationEntitlementService({
  repository,
  editableFields: EDITABLE_FIELDS,
  notFound: { code: 'VACATION_ENTITLEMENT_NOT_FOUND', message: 'El saldo de vacaciones no existe' },
});
