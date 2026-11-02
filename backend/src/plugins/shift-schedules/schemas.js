'use strict';

const Joi = require('joi');

const id = Joi.number().integer().positive();
const timeString = Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).message('El formato es HH:MM').allow(null);

const fields = {
  shift_id: id,
  day_of_week: Joi.number().integer().min(1).max(7),
  is_working_day: Joi.boolean(),
  check_in_time: timeString,
  check_out_time: timeString,
};

const create = Joi.object({
  shift_id: fields.shift_id.required(),
  day_of_week: fields.day_of_week.required(),
  is_working_day: fields.is_working_day.default(true),
  check_in_time: fields.check_in_time,
  check_out_time: fields.check_out_time,
}).unknown(false);

const update = Joi.object({ ...fields }).min(1).unknown(false);

const params = Joi.object({
  scheduleId: id.required(),
});

const list = Joi.object({
  shift_id: id,
  day_of_week: Joi.number().integer().min(1).max(7),
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
}).unknown(false);

module.exports = { create, update, params, list };
