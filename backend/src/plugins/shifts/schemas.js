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

const time = Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).message('El formato es HH:MM');

const scheduleDay = Joi.object({
  day_of_week: Joi.number().integer().min(1).max(7).required(),
  is_working_day: Joi.boolean().required(),
  check_in_time: Joi.when('is_working_day', { is: true, then: time.required(), otherwise: Joi.valid(null).default(null) }),
  check_out_time: Joi.when('is_working_day', { is: true, then: time.required(), otherwise: Joi.valid(null).default(null) }),
}).unknown(false);

const schedule = Joi.array().items(scheduleDay).length(7).unique('day_of_week');

module.exports = { create, update, params, list, schedule };
