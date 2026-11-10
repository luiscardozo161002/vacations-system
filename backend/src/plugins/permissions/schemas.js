'use strict';

const Joi = require('joi');

const id = Joi.number().integer().positive();

const fields = {
  permission_code: Joi.string().max(60),
  description: Joi.string().max(150),
  status: Joi.string().valid('active', 'inactive'),
};

const create = Joi.object({
  permission_code: fields.permission_code.required(),
  description: fields.description.required(),
  status: fields.status.default('active'),
}).unknown(false);

const update = Joi.object({ ...fields }).min(1).unknown(false);

const params = Joi.object({
  permissionId: id.required(),
});

const list = Joi.object({
  status: Joi.string().valid('active', 'inactive'),
  sort: Joi.string(),
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
}).unknown(false);

module.exports = { create, update, params, list };
