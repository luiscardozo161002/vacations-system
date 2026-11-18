const ApiRoutes = require('../../lib/api-routes');
const service = require('./service');

class HealthRoutes extends ApiRoutes {
  routes() {
    return [
      this.route({
        method: 'GET',
        path: '/api/v1/health',
        description: 'Verify that the API is available.',
        notes: 'No authentication required. Useful for monitoring and load balancing.',
        permission: false,
        handler: () => this.service.check(),
      }),
    ];
  }
}

module.exports = new HealthRoutes({ name: 'health', service }).plugin();
