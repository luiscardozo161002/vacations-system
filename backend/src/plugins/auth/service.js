'use strict';

const Jwt = require('@hapi/jwt');

const repository = require('./repository');
const db = require('../../db');
const { AppError } = require('../../lib/app-error');
const password = require('../../lib/password');
const { generateOpaqueToken, hashToken } = require('../../lib/tokens');
const config = require('../../config');
const { isExpired } = require('../../lib/temporary-password');

const addSeconds = (seconds) => new Date(Date.now() + seconds * 1000).toISOString();
const addMinutes = (minutes) => addSeconds(minutes * 60);
const addHours = (hours) => addSeconds(hours * 3600);
const addDays = (days) => addSeconds(days * 86400);

const issueAccessToken = async (user, trx) => {
  const scope = await repository.findPermissionCodes(user.role_id, trx);
  const role = await repository.findRoleCode(user.role_id, trx);
  const branches = await repository.findBranches(user.user_id, trx);
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
};

const issueTokens = async (user, context, trx) => {
  const accessToken = await issueAccessToken(user, trx);
  const refreshToken = generateOpaqueToken();
  await repository.createSession({
    user_id: user.user_id,
    refresh_token_hash: hashToken(refreshToken),
    ip_address: context.ip || null,
    user_agent: context.userAgent || null,
    expires_at: addDays(config.auth.refreshTokenTtlDays),
  }, trx);
  return { accessToken, refreshToken, expiresIn: config.auth.accessTokenTtlSeconds };
};

const inactiveAccount = () => new AppError('ACCOUNT_INACTIVE', 'El usuario no está activo');
const invalidRefreshToken = () => new AppError('INVALID_REFRESH_TOKEN', 'La sesión no es válida o expiró');
const invalidResetToken = () => new AppError('INVALID_RESET_TOKEN', 'El código de restablecimiento no es válido o expiró');
const invalidCurrentPassword = () => new AppError('INVALID_CURRENT_PASSWORD', 'La contraseña actual no es correcta');

const login = async ({ email, username, password: plainPassword }, context) => {
  const user = email ? await repository.findUserByEmail(email) : await repository.findUserByUsername(username);

  if (!user) {
    await repository.logAuditEvent(null, 'LOGIN_FAILED', { ...context, metadata: { attempted_login: email || username } });
    throw new AppError('INVALID_CREDENTIALS', 'Usuario o contraseña incorrectos');
  }

  if (user.status === 'locked') {
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      throw new AppError('ACCOUNT_LOCKED', 'La cuenta está bloqueada temporalmente por demasiados intentos fallidos');
    }

    await repository.updateUser(user.user_id, { status: 'active', failed_login_attempts: 0, locked_until: null });
    user.status = 'active';
    user.failed_login_attempts = 0;
  }

  if (user.status !== 'active') {
    throw inactiveAccount();
  }

  const validPassword = await password.verify(plainPassword, user.password_hash);

  if (!validPassword) {
    const attempts = user.failed_login_attempts + 1;
    const locked = attempts >= config.auth.maxFailedLoginAttempts;

    await repository.updateUser(user.user_id, {
      failed_login_attempts: attempts,
      ...(locked ? { status: 'locked', locked_until: addMinutes(config.auth.lockMinutes) } : {}),
    });
    await repository.logAuditEvent(user.user_id, 'LOGIN_FAILED', context);

    if (locked) {
      throw new AppError('ACCOUNT_LOCKED', 'La cuenta se bloqueó por demasiados intentos fallidos');
    }
    throw new AppError('INVALID_CREDENTIALS', 'Usuario o contraseña incorrectos');
  }

  if (isExpired(user)) {
    await repository.logAuditEvent(user.user_id, 'LOGIN_FAILED', { ...context, metadata: { reason: 'temporary_password_expired' } });
    throw new AppError(
      'TEMPORARY_PASSWORD_EXPIRED',
      'Tu contraseña temporal venció. Pide a Recursos Humanos que te reenvíe el acceso.'
    );
  }

  await repository.updateUser(user.user_id, {
    failed_login_attempts: 0,
    last_login_at: new Date().toISOString(),
    last_login_ip: context.ip || null,
  });

  const tokens = await issueTokens(user, context);

  await repository.logAuditEvent(user.user_id, 'LOGIN_SUCCESS', context);

  return {
    ...tokens,
    user: { user_id: user.user_id, username: user.username, email: user.email, role_id: user.role_id },
    must_change_password: user.must_change_password,
  };
};

const refresh = async ({ refreshToken }, context) => {
  const session = await repository.findActiveSessionByHash(hashToken(refreshToken));
  if (!session) throw invalidRefreshToken();

  return db.transaction(async (trx) => {
    const user = await repository.lockUser(session.user_id, trx);
    if (user?.status !== 'active') throw inactiveAccount();
    if (!(await repository.revokeSession(session.session_id, trx))) throw invalidRefreshToken();

    const tokens = await issueTokens(user, context, trx);
    await repository.logAuditEvent(user.user_id, 'TOKEN_REFRESH', context, trx);
    return tokens;
  });
};

const logout = async ({ refreshToken }, context) => {
  const session = await repository.findActiveSessionByHash(hashToken(refreshToken));
  if (session && (await repository.revokeSession(session.session_id))) {
    await repository.logAuditEvent(session.user_id, 'LOGOUT', context);
  }
};

const issueResetToken = (userId, email, context) => db.transaction(async (trx) => {
  const user = await repository.lockUser(userId, trx);
  if (user?.email !== email || user.status === 'inactive') return;

  const token = generateOpaqueToken();
  await repository.createPasswordResetToken({
    user_id: userId,
    token_hash: hashToken(token),
    expires_at: addHours(config.auth.passwordResetTtlHours),
  }, trx);
  await repository.logAuditEvent(userId, 'PASSWORD_RESET_REQUESTED', context, trx);
  return token;
});

const requestPasswordReset = async ({ email }, context) => {
  const user = await repository.findUserByEmail(email);
  const token = user ? await issueResetToken(user.user_id, email, context) : undefined;

  return {
    message: 'Si el correo existe, se generó un código de restablecimiento',
    ...(token && ['development', 'test'].includes(config.env) && { devToken: token }),
  };
};

const replacePassword = async (userId, passwordHash, fields, trx) => {
  await repository.updateUser(userId, {
    password_hash: passwordHash,
    must_change_password: false,
    temporary_password_expires_at: null,
    ...fields,
  }, trx);
  await repository.invalidateResetTokensForUser(userId, trx);
  await repository.revokeAllSessionsForUser(userId, trx);
};

const confirmPasswordReset = async ({ token, newPassword }, context) => {
  const resetRow = await repository.findActiveResetTokenByHash(hashToken(token));
  if (!resetRow) throw invalidResetToken();

  const newHash = await password.hash(newPassword);
  return db.transaction(async (trx) => {
    const user = await repository.lockUser(resetRow.user_id, trx);
    if (!user || user.status === 'inactive') throw invalidResetToken();
    if (!(await repository.markResetTokenUsed(resetRow.token_id, trx))) throw invalidResetToken();

    await replacePassword(user.user_id, newHash, {
      failed_login_attempts: 0,
      status: 'active',
      locked_until: null,
    }, trx);
    await repository.logAuditEvent(user.user_id, 'PASSWORD_RESET_COMPLETED', context, trx);
    return { message: 'Contraseña actualizada' };
  });
};

const getMe = async (userId) => {
  const row = await repository.findProfile(userId);
  if (!row) throw new AppError('USER_NOT_FOUND', 'El usuario no existe');

  const [permissions, assignedBranches] = await Promise.all([
    repository.findPermissionCodes(row.role_id),
    repository.findBranches(userId),
  ]);
  const branches =
    assignedBranches.length || !row.employee_id ? assignedBranches : await repository.findEmployeeBranch(row.employee_id);

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
};

const updateMe = async (userId, data) => {
  await repository.updateProfile(userId, data);
  return getMe(userId);
};

const changePassword = async (userId, { currentPassword, newPassword }, context) => {
  const user = await repository.findUserById(userId);
  if (!user) throw new AppError('USER_NOT_FOUND', 'El usuario no existe');

  if (!(await password.verify(currentPassword, user.password_hash))) throw invalidCurrentPassword();

  const newHash = await password.hash(newPassword);
  return db.transaction(async (trx) => {
    const current = await repository.lockUser(userId, trx);
    if (current?.status !== 'active') throw inactiveAccount();
    if (current.password_hash !== user.password_hash) throw invalidCurrentPassword();

    await replacePassword(userId, newHash, {}, trx);
    const tokens = await issueTokens(current, context, trx);
    await repository.logAuditEvent(userId, 'PASSWORD_CHANGED', context, trx);
    return tokens;
  });
};

module.exports = {
  login,
  refresh,
  logout,
  requestPasswordReset,
  confirmPasswordReset,
  getMe,
  updateMe,
  changePassword,
};
