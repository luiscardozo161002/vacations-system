'use strict';

const Joi = require('joi');

const id = Joi.number().integer().positive();

const fields = {
  company_id: id,
  code: Joi.string().max(20),
  branch_name: Joi.string().max(100),
  status: Joi.string().valid('active', 'inactive'),
};

const create = Joi.object({
  company_id: fields.company_id.required(),
  code: fields.code.required(),
  branch_name: fields.branch_name.required(),
  status: fields.status.default('active'),
}).unknown(false);

const update = Joi.object({ ...fields }).min(1).unknown(false);

const params = Joi.object({
  branchId: id.required(),
});

const list = Joi.object({
  company_id: id,
  status: Joi.string().valid('active', 'inactive'),
  sort: Joi.string(),
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
}).unknown(false);

module.exports = { create, update, params, list };
