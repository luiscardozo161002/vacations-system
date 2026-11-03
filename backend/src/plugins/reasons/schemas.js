'use strict';

const Joi = require('joi');

const id = Joi.number().integer().positive();

const fields = {
  description: Joi.string().max(100),
  requires_approval: Joi.boolean(),
  affects_vacation_balance: Joi.boolean(),
  status: Joi.string().valid('active', 'inactive'),
};

const create = Joi.object({
  description: fields.description.required(),
  requires_approval: fields.requires_approval.default(true),
  affects_vacation_balance: fields.affects_vacation_balance.default(false),
  status: fields.status.default('active'),
}).unknown(false);

const update = Joi.object({ ...fields }).min(1).unknown(false);

const params = Joi.object({
  reasonId: id.required(),
});

const list = Joi.object({
  requires_approval: Joi.boolean(),
  affects_vacation_balance: Joi.boolean(),
  status: Joi.string().valid('active', 'inactive'),
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
}).unknown(false);

module.exports = { create, update, params, list };
