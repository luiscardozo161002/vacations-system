const Joi = require('joi');
const ApiRoutes = require('../../lib/api-routes');
const { isoDate } = require('../../lib/list-query');
const service = require('./service');

class CalendarRoutes extends ApiRoutes {
  routes() {
    return [
      this.route({
        method: 'GET',
        path: '/api/v1/calendar',
        description: 'Absences and LFT holidays in a date range',
        permission: 'calendar:view',
        validate: { query: Joi.object({ from: isoDate.required(), to: isoDate.required() }).unknown(false) },
        handler: (request) => this.service.getCalendar(request.query, this.scope(request)),
      }),
    ];
  }
}

module.exports = new CalendarRoutes({ name: 'calendar', service }).plugin();
