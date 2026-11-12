'use strict';

const Joi = require('joi');

const id = Joi.number().integer().positive();

const params = Joi.object({
  logId: id.required(),
});

const list = Joi.object({
  user_id: id,
  event_type: Joi.string().max(40),
  result: Joi.string().valid('success', 'failed'),
  search: Joi.string().trim().max(100),
  sort: Joi.string(),
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
}).unknown(false);

module.exports = { params, list };
