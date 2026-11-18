'use strict';

const Joi = require('joi');
const { listOf, isoDate, pageSize } = require('../../lib/list-query');

const id = Joi.number().integer().positive();

const fields = {
  department_id: id,
  shift_id: id,
  folio: Joi.string().max(10),
  employee_number: Joi.string().max(20),
  employee_name: Joi.string().max(150),
  start_date: isoDate,
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
  email: Joi.string().email().max(120),
}).unknown(false);

const access = Joi.object({ email: Joi.string().email().max(120) }).allow(null).unknown(false);

const update = Joi.object({ ...fields }).min(1).unknown(false);

const params = Joi.object({
  employeeId: id.required(),
});

const filters = {
  search: Joi.string().trim().max(100),
  company_id: id,
  department_id: listOf(id),
  status: listOf(Joi.string().valid('active', 'inactive')),
  hired_from: isoDate,
  hired_to: isoDate,
};

const list = Joi.object({
  ...filters,
  sort: Joi.string(),
  page: Joi.number().integer().min(1).default(1),
  pageSize: pageSize.default(10),
}).unknown(false);

const exportQuery = Joi.object(filters).unknown(false);

module.exports = { create, update, params, list, exportQuery, access };
