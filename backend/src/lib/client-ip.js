const config = require('../config');

const { ipv4Mapped } = config.proxy;

class ClientIp {
  constructor(trustedProxies) {
    this.trustedProxies = trustedProxies;
  }

  normalize(ip) {
    return ip?.startsWith(ipv4Mapped) ? ip.slice(ipv4Mapped.length) : ip;
  }

  resolve(request) {
    const remote = this.normalize(request.info.remoteAddress);
    if (!this.trustedProxies.includes(remote)) return remote;

    const chain = (request.headers['x-forwarded-for'] ?? '')
      .split(',')
      .map((ip) => this.normalize(ip.trim()))
      .filter(Boolean);
    const client = chain.findLast((ip) => !this.trustedProxies.includes(ip));
    return client ?? remote;
  }
}

module.exports = new ClientIp(config.proxy.trusted);
module.exports.ClientIp = ClientIp;
