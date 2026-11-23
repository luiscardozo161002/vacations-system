'use strict';

const Joi = require('joi');
const { listOf, isoDate, pageSize } = require('../../lib/list-query');
const employeeFilter = require('../../lib/employee-filter');

const id = Joi.number().integer().positive();
const timeString = Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).message('El formato es HH:MM').allow(null);

const fields = {
  reason_id: id,
  absence_start_date: isoDate,
  absence_end_date: isoDate,
  absence_start_time: timeString,
  absence_end_time: timeString,
  skip_saturdays: Joi.boolean(),
  remarks: Joi.string().max(255).allow(null),
};

const create = Joi.object({
  ...fields,
  employee_id: id.required(),
  reason_id: fields.reason_id.required(),
  absence_start_date: fields.absence_start_date.required(),
  absence_end_date: fields.absence_end_date.required(),
}).unknown(false);

const preview = Joi.object({
  employee_id: id.required(),
  reason_id: fields.reason_id.required(),
  absence_start_date: fields.absence_start_date.required(),
  absence_end_date: fields.absence_end_date.required(),
  absence_start_time: fields.absence_start_time,
  absence_end_time: fields.absence_end_time,
  skip_saturdays: fields.skip_saturdays,
}).unknown(false);

const update = Joi.object(fields).min(1).unknown(false);

const params = Joi.object({
  noticeId: id.required(),
});

const list = Joi.object({
  employee_id: listOf(id),
  ...employeeFilter.schema,
  reason_id: listOf(id),
  kind: listOf(Joi.string().valid('request', 'notice')),
  status: listOf(Joi.string().valid('pending', 'approved', 'rejected', 'cancelled')),
  from: isoDate,
  to: isoDate,
  sort: Joi.string(),
  page: Joi.number().integer().min(1).default(1),
  pageSize,
}).unknown(false);

module.exports = { create, preview, update, params, list };
