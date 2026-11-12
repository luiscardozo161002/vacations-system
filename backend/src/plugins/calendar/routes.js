'use strict';

const Joi = require('joi');
const { requires } = require('../../lib/permissions');
const { scopeFrom } = require('../../lib/data-scope');
const service = require('./service');

const isoDate = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).message('El formato es AAAA-MM-DD');

const calendarPlugin = {
  name: 'calendar-plugin',
  version: '1.0.0',
  register: (server) => {
    server.route({
      method: 'GET',
      path: '/api/v1/calendar',
      options: {
        description: 'Absences and LFT holidays in a date range',
        tags: ['api', 'calendar'],
        auth: requires('calendar:view'),
        validate: { query: Joi.object({ from: isoDate.required(), to: isoDate.required() }).unknown(false) },
      },
      handler: (request) => service.getCalendar(request.query, scopeFrom(request.auth.credentials)),
    });
  },
};

module.exports = calendarPlugin;
