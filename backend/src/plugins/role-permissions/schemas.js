'use strict';

const Joi = require('joi');

const id = Joi.number().integer().positive();

const create = Joi.object({
  role_id: id.required(),
  permission_id: id.required(),
}).unknown(false);

const params = Joi.object({
  roleId: id.required(),
  permissionId: id.required(),
});

const list = Joi.object({
  role_id: id,
  permission_id: id,
  status: Joi.string().valid('active', 'inactive'),
  sort: Joi.string(),
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(200).default(50),
}).unknown(false);

module.exports = { create, params, list };
