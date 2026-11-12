'use strict';

const service = require('./service');

const notificationsPlugin = {
  name: 'notifications-plugin',
  version: '1.0.0',
  register: (server) => {
    server.route([
      {
        method: 'GET',
        path: '/api/v1/me/notifications',
        options: {
          description: 'Latest notifications of the current user and how many are unread',
          tags: ['api', 'notifications'],
        },
        handler: (request) => service.listMine(request.auth.credentials.user_id),
      },
      {
        method: 'POST',
        path: '/api/v1/me/notifications/read',
        options: {
          description: 'Mark every notification of the current user as read',
          tags: ['api', 'notifications'],
        },
        handler: (request) => service.markAllRead(request.auth.credentials.user_id),
      },
    ]);
  },
};

module.exports = notificationsPlugin;
