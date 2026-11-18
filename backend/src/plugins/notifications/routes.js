const ApiRoutes = require('../../lib/api-routes');
const service = require('./service');

class NotificationRoutes extends ApiRoutes {
  routes() {
    return [
      this.route({
        method: 'GET',
        path: '/api/v1/me/notifications',
        description: 'Latest notifications of the current user and how many are unread',
        handler: (request) => this.service.listMine(request.auth.credentials),
      }),
      this.route({
        method: 'POST',
        path: '/api/v1/me/notifications/read',
        description: 'Mark every notification of the current user as read',
        handler: (request) => this.service.markAllRead(request.auth.credentials),
      }),
    ];
  }
}

module.exports = new NotificationRoutes({ name: 'notifications', service }).plugin();
