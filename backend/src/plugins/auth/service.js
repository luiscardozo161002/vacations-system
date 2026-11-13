'use strict';

const Jwt = require('@hapi/jwt');

const repository = require('./repository');
const { AppError } = require('../../lib/app-error');
const password = require('../../lib/password');
const { generateOpaqueToken, hashToken } = require('../../lib/tokens');
const config = require('../../config');
const { isExpired } = require('../../lib/temporary-password');

const addSeconds = (seconds) => new Date(Date.now() + seconds * 1000).toISOString();
const addMinutes = (minutes) => addSeconds(minutes * 60);
const addHours = (hours) => addSeconds(hours * 3600);
const addDays = (days) => addSeconds(days * 86400);

const issueAccessToken = async (user) => {
  const [scope, role, branches] = await Promise.all([
    repository.findPermissionCodes(user.role_id),
    repository.findRoleCode(user.role_id),
    repository.findBranches(user.user_id),
  ]);
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

const issueSession = async (userId, context) => {
  const refreshToken = generateOpaqueToken();
  await repository.createSession({
    user_id: userId,
    refresh_token_hash: hashToken(refreshToken),
    ip_address: context.ip || null,
    user_agent: context.userAgent || null,
    expires_at: addDays(config.auth.refreshTokenTtlDays),
  });
  return refreshToken;
};

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
    throw new AppError('ACCOUNT_INACTIVE', 'El usuario no está activo');
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

  const accessToken = await issueAccessToken(user);
  const refreshToken = await issueSession(user.user_id, context);

  await repository.logAuditEvent(user.user_id, 'LOGIN_SUCCESS', context);

  return {
    accessToken,
    refreshToken,
    expiresIn: config.auth.accessTokenTtlSeconds,
    user: { user_id: user.user_id, username: user.username, email: user.email, role_id: user.role_id },
    must_change_password: user.must_change_password,
  };
};

const refresh = async ({ refreshToken }, context) => {
  const session = await repository.findActiveSessionByHash(hashToken(refreshToken));
  if (!session) {
    throw new AppError('INVALID_REFRESH_TOKEN', 'La sesión no es válida o expiró');
  }

  const user = await repository.findUserById(session.user_id);
  if (!user || user.status !== 'active') {
    throw new AppError('ACCOUNT_INACTIVE', 'El usuario no está activo');
  }

  await repository.revokeSession(session.session_id);
  const newRefreshToken = await issueSession(user.user_id, context);
  const accessToken = await issueAccessToken(user);

  await repository.logAuditEvent(user.user_id, 'TOKEN_REFRESH', context);

  return { accessToken, refreshToken: newRefreshToken, expiresIn: config.auth.accessTokenTtlSeconds };
};

const logout = async ({ refreshToken }, context) => {
  const session = await repository.findActiveSessionByHash(hashToken(refreshToken));
  if (session) {
    await repository.revokeSession(session.session_id);
    await repository.logAuditEvent(session.user_id, 'LOGOUT', context);
  }
};

const requestPasswordReset = async ({ email }, context) => {
  const user = await repository.findUserByEmail(email);

  let devToken;
  if (user && user.status !== 'inactive') {
    const token = generateOpaqueToken();
    await repository.createPasswordResetToken({
      user_id: user.user_id,
      token_hash: hashToken(token),
      expires_at: addHours(config.auth.passwordResetTtlHours),
    });
    await repository.logAuditEvent(user.user_id, 'PASSWORD_RESET_REQUESTED', context);

    if (config.env !== 'production') devToken = token;
  }

  return {
    message: 'Si el correo existe, se generó un código de restablecimiento',
    ...(devToken ? { devToken } : {}),
  };
};

const confirmPasswordReset = async ({ token, newPassword }, context) => {
  const resetRow = await repository.findActiveResetTokenByHash(hashToken(token));
  if (!resetRow) {
    throw new AppError('INVALID_RESET_TOKEN', 'El código de restablecimiento no es válido o expiró');
  }

  const newHash = await password.hash(newPassword);
  await repository.updateUser(resetRow.user_id, {
    password_hash: newHash,
    must_change_password: false,
    temporary_password_expires_at: null,
    failed_login_attempts: 0,
    status: 'active',
    locked_until: null,
  });
  await repository.markResetTokenUsed(resetRow.token_id);
  await repository.revokeAllSessionsForUser(resetRow.user_id);
  await repository.logAuditEvent(resetRow.user_id, 'PASSWORD_RESET_COMPLETED', context);

  return { message: 'Contraseña actualizada' };
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

  const validPassword = await password.verify(currentPassword, user.password_hash);
  if (!validPassword) {
    throw new AppError('INVALID_CURRENT_PASSWORD', 'La contraseña actual no es correcta');
  }

  await repository.updateUser(userId, {
    password_hash: await password.hash(newPassword),
    must_change_password: false,
    temporary_password_expires_at: null,
  });
  await repository.revokeAllSessionsForUser(userId);
  await repository.logAuditEvent(userId, 'PASSWORD_CHANGED', context);

  const refreshToken = await issueSession(userId, context);
  return { accessToken: await issueAccessToken(user), refreshToken, expiresIn: config.auth.accessTokenTtlSeconds };
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
