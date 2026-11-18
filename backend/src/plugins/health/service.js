class HealthService {
  constructor() {
    this.startedAt = Date.now();
  }

  check() {
    return {
      status: 'ok',
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = new HealthService();
