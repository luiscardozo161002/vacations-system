'use strict';

const Joi = require('joi');
const { listOf, isoDate, pageSize } = require('../../lib/list-query');

const id = Joi.number().integer().positive();

const params = Joi.object({
  logId: id.required(),
});

const list = Joi.object({
  user_id: id,
  event_type: listOf(Joi.string().max(40)),
  result: listOf(Joi.string().valid('success', 'failed')),
  from: isoDate,
  to: isoDate,
  search: Joi.string().trim().max(100),
  sort: Joi.string(),
  page: Joi.number().integer().min(1).default(1),
  pageSize,
}).unknown(false);

module.exports = { params, list };
