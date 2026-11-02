'use strict';

const Joi = require('joi');

const id = Joi.number().integer().positive();
const isoDateString = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).message('El formato es YYYY-MM-DD');
const timeString = Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).message('El formato es HH:MM').allow(null);
const minutes = Joi.number().integer().min(0).allow(null);

const fields = {
  employee_id: id,
  reason_id: id,
  approved_by: id.allow(null),
  status: Joi.string().valid('pending', 'approved', 'rejected', 'cancelled'),
  absence_start_date: isoDateString,
  absence_end_date: isoDateString,
  absence_start_time: timeString,
  absence_end_time: timeString,
  absence_start_minutes: minutes,
  absence_end_minutes: minutes,
  remaining_days: minutes,
  remaining_hours: minutes,
  remaining_minutes: minutes,
  remarks: Joi.string().max(255).allow(null),
  approved_at: Joi.string().isoDate().allow(null),
};

const create = Joi.object({
  employee_id: fields.employee_id.required(),
  reason_id: fields.reason_id.required(),
  approved_by: fields.approved_by,
  status: fields.status.default('pending'),
  absence_start_date: fields.absence_start_date.required(),
  absence_end_date: fields.absence_end_date.required(),
  absence_start_time: fields.absence_start_time,
  absence_end_time: fields.absence_end_time,
  absence_start_minutes: fields.absence_start_minutes,
  absence_end_minutes: fields.absence_end_minutes,
  remaining_days: fields.remaining_days,
  remaining_hours: fields.remaining_hours,
  remaining_minutes: fields.remaining_minutes,
  remarks: fields.remarks,
}).unknown(false);

const update = Joi.object({ ...fields }).min(1).unknown(false);

const params = Joi.object({
  noticeId: id.required(),
});

const list = Joi.object({
  employee_id: id,
  reason_id: id,
  status: Joi.string().valid('pending', 'approved', 'rejected', 'cancelled'),
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
}).unknown(false);

module.exports = { create, update, params, list };
