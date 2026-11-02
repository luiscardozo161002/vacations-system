'use strict';

const crypto = require('crypto');

// Tokens opacos (refresh tokens, tokens de reset de password): se generan al azar y solo se
// guarda su hash en la base, nunca el valor original (igual que una password, pero con sha256
// en vez de bcrypt porque ya son datos de alta entropia, no algo que un humano eligio).
const generateOpaqueToken = () => crypto.randomBytes(32).toString('hex');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

module.exports = { generateOpaqueToken, hashToken };
