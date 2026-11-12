'use strict';

const Joi = require('joi');

const id = Joi.number().integer().positive();
const isoDate = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).message('El formato es AAAA-MM-DD');

const fields = {
  employee_id: id,
  period_year: Joi.number().integer().min(2000).max(2100),
  years_of_service: Joi.number().integer().min(0),
  rule_id: id,
  total_days: Joi.number().integer().min(0),
  used_days: Joi.number().integer().min(0),
  used_hours: Joi.number().min(0).precision(2),
  period_start: isoDate,
  period_end: isoDate,
  status: Joi.string().valid('active', 'inactive'),
};

const create = Joi.object({
  employee_id: fields.employee_id.required(),
  period_year: fields.period_year.required(),
  years_of_service: fields.years_of_service.required(),
  rule_id: fields.rule_id.required(),
  total_days: fields.total_days.required(),
  used_days: fields.used_days.default(0),
  used_hours: fields.used_hours.default(0),
  period_start: fields.period_start.required(),
  period_end: fields.period_end.required(),
  status: fields.status.default('active'),
}).unknown(false);

const update = Joi.object({ ...fields }).min(1).unknown(false);

const params = Joi.object({
  entitlementId: id.required(),
});

const list = Joi.object({
  employee_id: id,
  period_year: Joi.number().integer().min(2000).max(2100),
  status: Joi.string().valid('active', 'inactive'),
  sort: Joi.string(),
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
}).unknown(false);

module.exports = { create, update, params, list };
