'use strict';

const Joi = require('joi');

const id = Joi.number().integer().positive();
const isoDateString = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).message('El formato es YYYY-MM-DD');
const timeString = Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).message('El formato es HH:MM').allow(null);
const nonNegativeInt = Joi.number().integer().min(0).allow(null);

const fields = {
  reason_id: id,
  absence_start_date: isoDateString,
  absence_end_date: isoDateString,
  absence_start_time: timeString,
  absence_end_time: timeString,
  remaining_days: nonNegativeInt,
  remaining_hours: nonNegativeInt,
  remarks: Joi.string().max(255).allow(null),
};

const create = Joi.object({
  ...fields,
  employee_id: id.required(),
  reason_id: fields.reason_id.required(),
  absence_start_date: fields.absence_start_date.required(),
  absence_end_date: fields.absence_end_date.required(),
}).unknown(false);

const update = Joi.object(fields).min(1).unknown(false);

const params = Joi.object({
  noticeId: id.required(),
});

const list = Joi.object({
  employee_id: id,
  reason_id: id,
  kind: Joi.string().valid('request', 'notice'),
  status: Joi.string().valid('pending', 'approved', 'rejected', 'cancelled'),
  from: isoDateString,
  to: isoDateString,
  sort: Joi.string(),
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
}).unknown(false);

module.exports = { create, update, params, list };
