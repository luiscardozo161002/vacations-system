'use strict';

const User = require('../users/model');
const UserSession = require('./models/user-session');
const PasswordResetToken = require('./models/password-reset-token');
const AuthAuditLog = require('../auth-audit-log/model');

const AUTH_COLUMNS = [
  'user_id',
  'employee_id',
  'role_id',
  'username',
  'email',
  'password_hash',
  'status',
  'failed_login_attempts',
  'locked_until',
];

const findUserByUsername = (username) => User.query().select(AUTH_COLUMNS).where('username', username).first();

const findUserByEmail = (email) => User.query().select(AUTH_COLUMNS).where('email', email).first();

const findUserById = (userId) => User.query().select(AUTH_COLUMNS).findById(userId);

const updateUser = (userId, patch) => User.query().findById(userId).patch(patch);

const createSession = (data) => UserSession.query().insert(data);

const findActiveSessionByHash = (refreshTokenHash) =>
  UserSession.query()
    .where('refresh_token_hash', refreshTokenHash)
    .whereNull('revoked_at')
    .where('expires_at', '>', new Date())
    .first();

const revokeSession = (sessionId) => UserSession.query().findById(sessionId).patch({ revoked_at: new Date() });

const revokeAllSessionsForUser = (userId) =>
  UserSession.query().where('user_id', userId).whereNull('revoked_at').patch({ revoked_at: new Date() });

const createPasswordResetToken = (data) => PasswordResetToken.query().insert(data);

const findActiveResetTokenByHash = (tokenHash) =>
  PasswordResetToken.query()
    .where('token_hash', tokenHash)
    .whereNull('used_at')
    .where('expires_at', '>', new Date())
    .first();

const markResetTokenUsed = (tokenId) => PasswordResetToken.query().findById(tokenId).patch({ used_at: new Date() });

const logAuditEvent = (userId, eventType, { ip, userAgent, metadata } = {}) =>
  AuthAuditLog.query().insert({
    user_id: userId || null,
    event_type: eventType,
    ip_address: ip || null,
    user_agent: userAgent || null,
    metadata: metadata || null,
  });

module.exports = {
  findUserByUsername,
  findUserByEmail,
  findUserById,
  updateUser,
  createSession,
  findActiveSessionByHash,
  revokeSession,
  revokeAllSessionsForUser,
  createPasswordResetToken,
  findActiveResetTokenByHash,
  markResetTokenUsed,
  logAuditEvent,
};
