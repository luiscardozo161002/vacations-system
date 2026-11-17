const CrudRoutes = require('../../lib/crud/crud-routes');
const service = require('./service');
const schemas = require('./schemas');

class EmployeeRoutes extends CrudRoutes {
  routes() {
    return [this.exportRoute(), ...super.routes(), this.accessRoute()];
  }

  exportRoute() {
    return this.route({
      action: 'export',
      method: 'GET',
      path: `${this.path}/export`,
      description: 'Download the filtered employees as CSV',
      permission: this.permissions.view,
      validate: { query: this.schemas.exportQuery },
      handler: async (request, h) => {
        const csv = await this.service.exportCsv(request.query, this.scope(request));
        const today = new Date().toISOString().slice(0, 10);
        return h
          .response(csv)
          .type('text/csv; charset=utf-8')
          .header('content-disposition', `attachment; filename="empleados-${today}.csv"`);
      },
    });
  }

  accessRoute() {
    return this.route({
      action: 'access',
      method: 'POST',
      path: `${this.itemPath()}/access`,
      description: 'Create or renew the employee account with a temporary password',
      permission: this.permissions.update,
      validate: { params: this.schemas.params, payload: this.schemas.access },
      handler: (request) =>
        this.service.resendAccess(request.params.employeeId, request.payload?.email, this.scope(request)),
    });
  }
}

module.exports = new EmployeeRoutes({
  name: 'employees',
  tag: 'employees',
  path: '/api/v1/employees',
  idParam: 'employeeId',
  primaryKey: 'employee_id',
  label: { singular: 'employee', plural: 'employees' },
  permissions: {
    view: 'employees:view',
    create: 'employees:create',
    update: 'employees:update',
    delete: 'employees:delete',
  },
  schemas,
  service,
  audit: {
    entity: 'employee',
    events: {
      create: 'EMPLOYEE_CREATED',
      update: 'EMPLOYEE_UPDATED',
      remove: 'EMPLOYEE_DEACTIVATED',
      access: 'EMPLOYEE_ACCESS_GRANTED',
      export: 'EMPLOYEES_EXPORTED',
    },
  },
}).plugin();
