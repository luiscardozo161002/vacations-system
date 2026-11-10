'use strict';

const Joi = require('joi');

const id = Joi.number().integer().positive();

const fields = {
  code: Joi.string().max(20),
  shift_name: Joi.string().max(100),
  number_days: Joi.number().integer().min(1).max(7),
  status: Joi.string().valid('active', 'inactive'),
};

const create = Joi.object({
  code: fields.code.required(),
  shift_name: fields.shift_name.required(),
  number_days: fields.number_days.required(),
  status: fields.status.default('active'),
}).unknown(false);

const update = Joi.object({ ...fields }).min(1).unknown(false);

const params = Joi.object({
  shiftId: id.required(),
});

const list = Joi.object({
  status: Joi.string().valid('active', 'inactive'),
  sort: Joi.string(),
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
}).unknown(false);

module.exports = { create, update, params, list };
