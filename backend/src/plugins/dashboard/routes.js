'use strict';

const { requires } = require('../../lib/permissions');
const { scopeFrom } = require('../../lib/data-scope');
const service = require('./service');

const dashboardPlugin = {
  name: 'dashboard-plugin',
  version: '1.0.0',
  register: (server) => {
    server.route([
      {
        method: 'GET',
        path: '/api/v1/dashboard/summary',
        options: {
          description: 'Team indicators, upcoming absences, employees by department and recent activity',
          tags: ['api', 'dashboard'],
          auth: requires('employees:view'),
        },
        handler: (request) => service.teamSummary(scopeFrom(request.auth.credentials)),
      },
      {
        method: 'GET',
        path: '/api/v1/dashboard/me',
        options: {
          description: 'Profile, balance, requests and notices of the current employee',
          tags: ['api', 'dashboard'],
          auth: requires('dashboard:view'),
        },
        handler: (request) => service.mySummary(scopeFrom(request.auth.credentials)),
      },
    ]);
  },
};

module.exports = dashboardPlugin;
