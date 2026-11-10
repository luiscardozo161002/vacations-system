'use strict';

const db = require('../../db');
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

const updateProfile = (userId, data) => User.query().findById(userId).patch({ ...data, updated_at: db.fn.now() });

const findProfile = (userId) =>
  db('users as u')
    .join('roles as r', 'r.role_id', 'u.role_id')
    .leftJoin('employees as e', 'e.employee_id', 'u.employee_id')
    .select(
      'u.user_id',
      'u.username',
      'u.email',
      'u.status',
      'u.last_login_at',
      'r.role_id',
      'r.role_code',
      'r.description as role_description',
      'e.employee_id',
      'e.employee_number',
      'e.employee_name',
      'e.department_id',
      'e.shift_id'
    )
    .where('u.user_id', userId)
    .first();

const findPermissionCodes = (roleId) =>
  db('role_permissions as rp')
    .join('permissions as p', 'p.permission_id', 'rp.permission_id')
    .where({ 'rp.role_id': roleId, 'rp.status': 'active', 'p.status': 'active' })
    .orderBy('p.permission_code')
    .pluck('p.permission_code');

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
  updateProfile,
  findProfile,
  findPermissionCodes,
  createSession,
  findActiveSessionByHash,
  revokeSession,
  revokeAllSessionsForUser,
  createPasswordResetToken,
  findActiveResetTokenByHash,
  markResetTokenUsed,
  logAuditEvent,
};
