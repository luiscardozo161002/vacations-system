'use strict';

const Joi = require('joi');

const id = Joi.number().integer().positive();
const isoDateString = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).message('El formato es AAAA-MM-DD');

const fields = {
  department_id: id,
  shift_id: id,
  folio: Joi.string().max(10),
  employee_number: Joi.string().max(20),
  employee_name: Joi.string().max(150),
  start_date: isoDateString,
  status: Joi.string().valid('active', 'inactive'),
};

const create = Joi.object({
  department_id: fields.department_id.required(),
  shift_id: fields.shift_id.required(),
  folio: fields.folio.required(),
  employee_number: fields.employee_number.required(),
  employee_name: fields.employee_name.required(),
  start_date: fields.start_date.required(),
  status: fields.status.default('active'),
}).unknown(false);

const update = Joi.object({ ...fields }).min(1).unknown(false);

const params = Joi.object({
  employeeId: id.required(),
});

const list = Joi.object({
  department_id: id,
  status: Joi.string().valid('active', 'inactive'),
  sort: Joi.string(),
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
}).unknown(false);

module.exports = { create, update, params, list };
