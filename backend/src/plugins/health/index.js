const startedAt = Date.now();

const healthPlugin = {
  name: 'health-plugin',
  version: '1.0.0',
  register: (server) => {
    server.route({
      method: 'GET',
      path: '/api/v1/health',
      options: {
        description: 'Verify that the API is available.',
        notes: 'No authentication required. Useful for monitoring and load balancing.',
        tags: ['api', 'health'],
      },
      handler: () => ({
        status: 'ok',
        uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
        timestamp: new Date().toISOString(),
      }),
    });
  },
};

module.exports = healthPlugin;
