'use strict';

const Joi = require('joi');
const config = require('../../config');
const { listOf, pageSize } = require('../../lib/list-query');

const id = Joi.number().integer().positive();

const fields = {
  employee_id: id.allow(null),
  role_id: id,
  username: Joi.string().max(50),
  email: Joi.string().email().max(120),
  status: Joi.string().valid('active', 'inactive', 'locked'),
  review_actions: Joi.array().items(Joi.string().valid('approve', 'reject', 'cancel')).unique(),
};

const password = Joi.string().min(config.passwordPolicy.minLength).max(config.passwordPolicy.maxLength);

const create = Joi.object({
  employee_id: fields.employee_id,
  role_id: fields.role_id.required(),
  username: fields.username.required(),
  email: fields.email.required(),
  status: fields.status.default('active'),
  review_actions: fields.review_actions,
  password: password.required(),
}).unknown(false);

const update = Joi.object({ ...fields, password }).min(1).unknown(false);

const params = Joi.object({
  userId: id.required(),
});

const branches = Joi.object({
  branch_ids: Joi.array().items(id).required(),
}).unknown(false);

const list = Joi.object({
  role_id: listOf(id),
  status: listOf(Joi.string().valid('active', 'inactive', 'locked')),
  employee_id: id,
  sort: Joi.string(),
  page: Joi.number().integer().min(1).default(1),
  pageSize,
}).unknown(false);

module.exports = { create, update, params, list, branches };
