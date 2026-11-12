'use strict';

const Joi = require('joi');

const id = Joi.number().integer().positive();

const fields = {
  branch_id: id,
  code: Joi.string().max(20),
  department_name: Joi.string().max(150),
  manager_employee_id: id.allow(null),
  status: Joi.string().valid('active', 'inactive'),
};

const create = Joi.object({
  branch_id: fields.branch_id.required(),
  code: fields.code.required(),
  department_name: fields.department_name.required(),
  manager_employee_id: fields.manager_employee_id,
  status: fields.status.default('active'),
}).unknown(false);

const update = Joi.object({ ...fields }).min(1).unknown(false);

const params = Joi.object({
  departmentId: id.required(),
});

const list = Joi.object({
  branch_id: id,
  status: Joi.string().valid('active', 'inactive'),
  sort: Joi.string(),
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
}).unknown(false);

module.exports = { create, update, params, list };
