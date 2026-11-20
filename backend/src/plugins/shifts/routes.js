const CrudRoutes = require('../../lib/crud/crud-routes');
const service = require('./service');
const schemas = require('./schemas');

class ShiftRoutes extends CrudRoutes {
  routes() {
    return [...super.routes(), this.replaceScheduleRoute()];
  }

  replaceScheduleRoute() {
    return this.route({
      action: 'schedule',
      method: 'PUT',
      path: `${this.itemPath()}/schedule`,
      description: 'Replace the weekly schedule of a shift (all 7 days at once)',
      permission: this.permissions.update,
      validate: { params: this.schemas.params, payload: this.schemas.schedule },
      handler: (request) => this.service.replaceSchedule(request.params.shiftId, request.payload),
    });
  }
}

module.exports = new ShiftRoutes({
  name: 'shifts',
  tag: 'shifts',
  path: '/api/v1/shifts',
  idParam: 'shiftId',
  primaryKey: 'shift_id',
  label: { singular: 'shift', plural: 'shifts' },
  permissions: { view: 'shifts:view', create: 'shifts:create', update: 'shifts:update', delete: 'shifts:delete' },
  schemas,
  service,
  audit: {
    entity: 'shift',
    events: {
      create: 'SHIFT_CREATED',
      update: 'SHIFT_UPDATED',
      remove: 'SHIFT_DEACTIVATED',
      schedule: 'SHIFT_SCHEDULE_REPLACED',
    },
  },
}).plugin();
