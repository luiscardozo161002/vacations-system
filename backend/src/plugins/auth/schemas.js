'use strict';

const Joi = require('joi');

const login = Joi.object({
  email: Joi.string().email().max(120),
  username: Joi.string().max(50),
  password: Joi.string().max(100).required(),
})
  .xor('email', 'username')
  .unknown(false);

const refresh = Joi.object({
  refreshToken: Joi.string().required(),
}).unknown(false);

const logout = Joi.object({
  refreshToken: Joi.string().required(),
}).unknown(false);

const passwordResetRequest = Joi.object({
  email: Joi.string().email().max(120).required(),
}).unknown(false);

const passwordResetConfirm = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(8).max(100).required(),
}).unknown(false);

const updateMe = Joi.object({
  username: Joi.string().max(50),
  email: Joi.string().email().max(120),
})
  .min(1)
  .unknown(false);

const changePassword = Joi.object({
  currentPassword: Joi.string().max(100).required(),
  newPassword: Joi.string().min(8).max(100).required(),
}).unknown(false);

module.exports = {
  login,
  refresh,
  logout,
  passwordResetRequest,
  passwordResetConfirm,
  updateMe,
  changePassword,
};
