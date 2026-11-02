'use strict';

const Joi = require('joi');

const id = Joi.number().integer().positive();

const fields = {
  years_from: Joi.number().integer().min(0),
  years_to: Joi.number().integer().min(0).allow(null),
  vacation_days: Joi.number().integer().min(1),
  effective_year: Joi.number().integer().min(2000).max(2100),
  status: Joi.string().valid('active', 'inactive'),
};

const create = Joi.object({
  years_from: fields.years_from.required(),
  years_to: fields.years_to,
  vacation_days: fields.vacation_days.required(),
  effective_year: fields.effective_year.required(),
  status: fields.status.default('active'),
}).unknown(false);

const update = Joi.object({ ...fields }).min(1).unknown(false);

const params = Joi.object({
  ruleId: id.required(),
});

const list = Joi.object({
  status: Joi.string().valid('active', 'inactive'),
  effective_year: Joi.number().integer().min(2000).max(2100),
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
}).unknown(false);

module.exports = { create, update, params, list };
