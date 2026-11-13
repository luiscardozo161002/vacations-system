'use strict';

const config = require('../config');

const IPV4_MAPPED = '::ffff:';

const normalize = (ip) => (ip?.startsWith(IPV4_MAPPED) ? ip.slice(IPV4_MAPPED.length) : ip);

const clientIp = (request, trusted = config.proxy.trusted) => {
  const remote = normalize(request.info.remoteAddress);
  if (!trusted.includes(remote)) return remote;

  const chain = (request.headers['x-forwarded-for'] ?? '')
    .split(',')
    .map((ip) => normalize(ip.trim()))
    .filter(Boolean);
  for (let index = chain.length - 1; index >= 0; index -= 1) {
    if (!trusted.includes(chain[index])) return chain[index];
  }
  return remote;
};

module.exports = { clientIp };
