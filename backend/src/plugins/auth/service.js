const Jwt = require('@hapi/jwt');

const repository = require('./repository');
const db = require('../../db');
const { AppError } = require('../../lib/app-error');
const password = require('../../lib/password');
const opaqueTokens = require('../../lib/tokens');
const config = require('../../config');
const temporaryPassword = require('../../lib/temporary-password');

const addSeconds = (seconds) => new Date(Date.now() + seconds * 1000).toISOString();
const addMinutes = (minutes) => addSeconds(minutes * 60);
const addHours = (hours) => addSeconds(hours * 3600);
const addDays = (days) => addSeconds(days * 86400);

const inactiveAccount = () => new AppError('ACCOUNT_INACTIVE', 'El usuario no está activo');
const invalidRefreshToken = () => new AppError('INVALID_REFRESH_TOKEN', 'La sesión no es válida o expiró');
const invalidResetToken = () => new AppError('INVALID_RESET_TOKEN', 'El código de restablecimiento no es válido o expiró');
const invalidCurrentPassword = () => new AppError('INVALID_CURRENT_PASSWORD', 'La contraseña actual no es correcta');
const invalidCredentials = () => new AppError('INVALID_CREDENTIALS', 'Usuario o contraseña incorrectos');

class AuthService {
  constructor(repository) {
    this.repository = repository;
  }

  async issueAccessToken(user, trx) {
    const scope = await this.repository.findPermissionCodes(user.role_id, trx);
    const role = await this.repository.findRoleCode(user.role_id, trx);
    const branches = await this.repository.findBranches(user.user_id, trx);
    return Jwt.token.generate(
      {
        user_id: user.user_id,
        role_id: user.role_id,
        role,
        employee_id: user.employee_id,
        username: user.username,
        branch_ids: branches.map((branch) => branch.branch_id),
        scope,
      },
      { key: config.auth.jwtSecret, algorithm: 'HS256' },
      { ttlSec: config.auth.accessTokenTtlSeconds }
    );
  }

  async issueTokens(user, context, trx) {
    const accessToken = await this.issueAccessToken(user, trx);
    const refreshToken = opaqueTokens.generate();
    await this.repository.createSession(
      {
        user_id: user.user_id,
        refresh_token_hash: opaqueTokens.hash(refreshToken),
        ip_address: context.ip || null,
        user_agent: context.userAgent || null,
        expires_at: addDays(config.auth.refreshTokenTtlDays),
      },
      trx
    );
    return { accessToken, refreshToken, expiresIn: config.auth.accessTokenTtlSeconds };
  }

  async unlockIfLockExpired(user) {
    if (user.status !== 'locked') return;
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      throw new AppError('ACCOUNT_LOCKED', 'La cuenta está bloqueada temporalmente por demasiados intentos fallidos');
    }

    await this.repository.updateUser(user.user_id, { status: 'active', failed_login_attempts: 0, locked_until: null });
    user.status = 'active';
    user.failed_login_attempts = 0;
  }

  async registerFailedPassword(user, context) {
    const attempts = user.failed_login_attempts + 1;
    const locked = attempts >= config.auth.maxFailedLoginAttempts;

    await this.repository.updateUser(user.user_id, {
      failed_login_attempts: attempts,
      ...(locked ? { status: 'locked', locked_until: addMinutes(config.auth.lockMinutes) } : {}),
    });
    await this.repository.logAuditEvent(user.user_id, 'LOGIN_FAILED', context);

    if (locked) throw new AppError('ACCOUNT_LOCKED', 'La cuenta se bloqueó por demasiados intentos fallidos');
    throw invalidCredentials();
  }

  async login({ email, username, password: plainPassword }, context) {
    const user = email ? await this.repository.findUserByEmail(email) : await this.repository.findUserByUsername(username);

    if (!user) {
      await this.repository.logAuditEvent(null, 'LOGIN_FAILED', { ...context, metadata: { attempted_login: email || username } });
      throw invalidCredentials();
    }

    await this.unlockIfLockExpired(user);
    if (user.status !== 'active') throw inactiveAccount();

    if (!(await password.verify(plainPassword, user.password_hash))) {
      await this.registerFailedPassword(user, context);
    }

    if (temporaryPassword.isExpired(user)) {
      await this.repository.logAuditEvent(user.user_id, 'LOGIN_FAILED', {
        ...context,
        metadata: { reason: 'temporary_password_expired' },
      });
      throw new AppError(
        'TEMPORARY_PASSWORD_EXPIRED',
        'Tu contraseña temporal venció. Pide a Recursos Humanos que te reenvíe el acceso.'
      );
    }

    await this.repository.updateUser(user.user_id, {
      failed_login_attempts: 0,
      last_login_at: new Date().toISOString(),
      last_login_ip: context.ip || null,
    });

    const tokens = await this.issueTokens(user, context);
    await this.repository.logAuditEvent(user.user_id, 'LOGIN_SUCCESS', context);

    return {
      ...tokens,
      user: { user_id: user.user_id, username: user.username, email: user.email, role_id: user.role_id },
      must_change_password: user.must_change_password,
    };
  }

  async refresh({ refreshToken }, context) {
    const session = await this.repository.findActiveSessionByHash(opaqueTokens.hash(refreshToken));
    if (!session) throw invalidRefreshToken();

    return db.transaction(async (trx) => {
      const user = await this.repository.lockUser(session.user_id, trx);
      if (user?.status !== 'active') throw inactiveAccount();
      if (!(await this.repository.revokeSession(session.session_id, trx))) throw invalidRefreshToken();

      const tokens = await this.issueTokens(user, context, trx);
      await this.repository.logAuditEvent(user.user_id, 'TOKEN_REFRESH', context, trx);
      return tokens;
    });
  }

  async logout({ refreshToken }, context) {
    const session = await this.repository.findActiveSessionByHash(opaqueTokens.hash(refreshToken));
    if (session && (await this.repository.revokeSession(session.session_id))) {
      await this.repository.logAuditEvent(session.user_id, 'LOGOUT', context);
    }
  }

  issueResetToken(userId, email, context) {
    return db.transaction(async (trx) => {
      const user = await this.repository.lockUser(userId, trx);
      if (user?.email !== email || user.status === 'inactive') return undefined;

      const token = opaqueTokens.generate();
      await this.repository.createPasswordResetToken(
        {
          user_id: userId,
          token_hash: opaqueTokens.hash(token),
          expires_at: addHours(config.auth.passwordResetTtlHours),
        },
        trx
      );
      await this.repository.logAuditEvent(userId, 'PASSWORD_RESET_REQUESTED', context, trx);
      return token;
    });
  }

  async requestPasswordReset({ email }, context) {
    const user = await this.repository.findUserByEmail(email);
    const token = user ? await this.issueResetToken(user.user_id, email, context) : undefined;

    return {
      message: 'Si el correo existe, se generó un código de restablecimiento',
      ...(token && ['development', 'test'].includes(config.env) && { devToken: token }),
    };
  }

  async replacePassword(userId, passwordHash, fields, trx) {
    await this.repository.updateUser(
      userId,
      {
        password_hash: passwordHash,
        must_change_password: false,
        temporary_password_expires_at: null,
        ...fields,
      },
      trx
    );
    await this.repository.invalidateResetTokensForUser(userId, trx);
    await this.repository.revokeAllSessionsForUser(userId, trx);
  }

  async confirmPasswordReset({ token, newPassword }, context) {
    const resetRow = await this.repository.findActiveResetTokenByHash(opaqueTokens.hash(token));
    if (!resetRow) throw invalidResetToken();

    const newHash = await password.hash(newPassword);
    return db.transaction(async (trx) => {
      const user = await this.repository.lockUser(resetRow.user_id, trx);
      if (!user || user.status === 'inactive') throw invalidResetToken();
      if (!(await this.repository.markResetTokenUsed(resetRow.token_id, trx))) throw invalidResetToken();

      await this.replacePassword(
        user.user_id,
        newHash,
        { failed_login_attempts: 0, status: 'active', locked_until: null },
        trx
      );
      await this.repository.logAuditEvent(user.user_id, 'PASSWORD_RESET_COMPLETED', context, trx);
      return { message: 'Contraseña actualizada' };
    });
  }

  async getMe(userId) {
    const row = await this.repository.findProfile(userId);
    if (!row) throw new AppError('USER_NOT_FOUND', 'El usuario no existe');

    const [permissions, assignedBranches] = await Promise.all([
      this.repository.findPermissionCodes(row.role_id),
      this.repository.findBranches(userId),
    ]);
    const branches =
      assignedBranches.length || !row.employee_id
        ? assignedBranches
        : await this.repository.findEmployeeBranch(row.employee_id);

    return {
      user_id: row.user_id,
      username: row.username,
      email: row.email,
      status: row.status,
      last_login_at: row.last_login_at,
      review_actions: row.review_actions,
      must_change_password: row.must_change_password,
      temporary_password_expires_at: row.temporary_password_expires_at,
      role: { role_id: row.role_id, role_code: row.role_code, description: row.role_description },
      employee: row.employee_id
        ? {
            employee_id: row.employee_id,
            employee_number: row.employee_number,
            employee_name: row.employee_name,
            department_id: row.department_id,
            shift_id: row.shift_id,
          }
        : null,
      branches,
      permissions,
    };
  }

  async updateMe(userId, data) {
    await this.repository.updateProfile(userId, data);
    return this.getMe(userId);
  }

  async changePassword(userId, { currentPassword, newPassword }, context) {
    const user = await this.repository.findUserById(userId);
    if (!user) throw new AppError('USER_NOT_FOUND', 'El usuario no existe');

    if (!(await password.verify(currentPassword, user.password_hash))) throw invalidCurrentPassword();

    const newHash = await password.hash(newPassword);
    return db.transaction(async (trx) => {
      const current = await this.repository.lockUser(userId, trx);
      if (current?.status !== 'active') throw inactiveAccount();
      if (current.password_hash !== user.password_hash) throw invalidCurrentPassword();

      await this.replacePassword(userId, newHash, {}, trx);
      const tokens = await this.issueTokens(current, context, trx);
      await this.repository.logAuditEvent(userId, 'PASSWORD_CHANGED', context, trx);
      return tokens;
    });
  }
}

module.exports = new AuthService(repository);
