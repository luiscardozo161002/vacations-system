const ApiRoutes = require('../../lib/api-routes');
const service = require('./service');
const schemas = require('./schemas');

class UserSettingsRoutes extends ApiRoutes {
  routes() {
    return [
      this.route({
        method: 'GET',
        path: '/api/v1/me/settings',
        description: 'Appearance settings saved for the current user',
        handler: (request) => this.service.get(request.auth.credentials.user_id),
      }),
      this.route({
        method: 'PUT',
        path: '/api/v1/me/settings',
        description: 'Save appearance settings for the current user; only the fields sent change',
        validate: { payload: schemas.update },
        handler: (request) => this.service.save(request.auth.credentials.user_id, request.payload),
      }),
    ];
  }
}

module.exports = new UserSettingsRoutes({ name: 'user-settings', tag: 'settings', service }).plugin();
