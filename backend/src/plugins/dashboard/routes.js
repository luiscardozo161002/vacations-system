const ApiRoutes = require('../../lib/api-routes');
const service = require('./service');

class DashboardRoutes extends ApiRoutes {
  routes() {
    return [this.teamSummaryRoute(), this.mySummaryRoute()];
  }

  teamSummaryRoute() {
    return this.route({
      method: 'GET',
      path: '/api/v1/dashboard/summary',
      description: 'Team indicators, upcoming absences, employees by department and recent activity',
      permission: 'employees:view',
      handler: (request) => this.service.teamSummary(this.scope(request)),
    });
  }

  mySummaryRoute() {
    return this.route({
      method: 'GET',
      path: '/api/v1/dashboard/me',
      description: 'Profile, balance, requests and notices of the current employee',
      permission: 'dashboard:view',
      handler: (request) => this.service.mySummary(this.scope(request)),
    });
  }
}

module.exports = new DashboardRoutes({ name: 'dashboard', service }).plugin();
