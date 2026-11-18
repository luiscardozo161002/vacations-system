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
  'must_change_password',
  'temporary_password_expires_at',
];

const BRANCH_COLUMNS = ['b.branch_id', 'b.company_id', 'c.company_name', 'b.code', 'b.branch_name'];

class AuthRepository {
  findUserByUsername(username) {
    return User.query().select(AUTH_COLUMNS).where('username', username).first();
  }

  findUserByEmail(email) {
    return User.query().select(AUTH_COLUMNS).where('email', email).first();
  }

  findUserById(userId, trx) {
    return User.query(trx).select(AUTH_COLUMNS).findById(userId);
  }

  lockUser(userId, trx) {
    return this.findUserById(userId, trx).forNoKeyUpdate();
  }

  updateUser(userId, patch, trx) {
    return User.query(trx).findById(userId).patch(patch);
  }

  updateProfile(userId, data) {
    return User.query().findById(userId).patch({ ...data, updated_at: db.fn.now() });
  }

  findProfile(userId) {
    return db('users as u')
      .join('roles as r', 'r.role_id', 'u.role_id')
      .leftJoin('employees as e', 'e.employee_id', 'u.employee_id')
      .select(
        'u.user_id',
        'u.username',
        'u.email',
        'u.status',
        'u.last_login_at',
        'u.review_actions',
        'u.must_change_password',
        'u.temporary_password_expires_at',
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
  }

  findPermissionCodes(roleId, trx = db) {
    return trx('role_permissions as rp')
      .join('permissions as p', 'p.permission_id', 'rp.permission_id')
      .where({ 'rp.role_id': roleId, 'rp.status': 'active', 'p.status': 'active' })
      .orderBy('p.permission_code')
      .pluck('p.permission_code');
  }

  async findRoleCode(roleId, trx = db) {
    const row = await trx('roles').where('role_id', roleId).first('role_code');
    return row?.role_code ?? null;
  }

  branchesQuery(trx = db) {
    return trx('branches as b').join('company as c', 'c.company_id', 'b.company_id').orderBy('b.branch_id');
  }

  findBranches(userId, trx) {
    return this.branchesQuery(trx)
      .join('user_branches as ub', 'ub.branch_id', 'b.branch_id')
      .where('ub.user_id', userId)
      .select(BRANCH_COLUMNS);
  }

  findEmployeeBranch(employeeId) {
    return this.branchesQuery()
      .join('departments as d', 'd.branch_id', 'b.branch_id')
      .join('employees as e', 'e.department_id', 'd.department_id')
      .where('e.employee_id', employeeId)
      .select(BRANCH_COLUMNS);
  }

  createSession(data, trx) {
    return UserSession.query(trx).insert(data);
  }

  activeSessions(trx) {
    return UserSession.query(trx).whereNull('revoked_at').where('expires_at', '>', new Date());
  }

  findActiveSessionByHash(refreshTokenHash) {
    return this.activeSessions().where('refresh_token_hash', refreshTokenHash).first('session_id', 'user_id');
  }

  revokeSession(sessionId, trx) {
    return this.activeSessions(trx).findById(sessionId).patch({ revoked_at: new Date() });
  }

  revokeAllSessionsForUser(userId, trx) {
    return UserSession.query(trx).where('user_id', userId).whereNull('revoked_at').patch({ revoked_at: new Date() });
  }

  createPasswordResetToken(data, trx) {
    return PasswordResetToken.query(trx).insert(data);
  }

  activeResetTokens(trx) {
    return PasswordResetToken.query(trx).whereNull('used_at').where('expires_at', '>', new Date());
  }

  findActiveResetTokenByHash(tokenHash) {
    return this.activeResetTokens().where('token_hash', tokenHash).first('token_id', 'user_id');
  }

  markResetTokenUsed(tokenId, trx) {
    return this.activeResetTokens(trx).findById(tokenId).patch({ used_at: new Date() });
  }

  invalidateResetTokensForUser(userId, trx) {
    return this.activeResetTokens(trx).where('user_id', userId).patch({ used_at: new Date() });
  }

  logAuditEvent(userId, eventType, { ip, userAgent, requestId, metadata } = {}, trx) {
    return AuthAuditLog.query(trx).insert({
      user_id: userId || null,
      event_type: eventType,
      result: eventType.endsWith('_FAILED') ? 'failed' : 'success',
      entity: userId ? 'user' : null,
      entity_id: userId ? String(userId) : null,
      ip_address: ip || null,
      user_agent: userAgent || null,
      request_id: requestId || null,
      metadata: metadata || null,
    });
  }
}

module.exports = new AuthRepository();
