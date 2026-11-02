'use strict';

const Joi = require('joi');

const id = Joi.number().integer().positive();

const fields = {
  folio: Joi.string().max(15),
  company_name: Joi.string().max(150),
  company_branch: Joi.string().max(100).allow(null),
  status: Joi.string().valid('active', 'inactive'),
};

const create = Joi.object({
  folio: fields.folio.required(),
  company_name: fields.company_name.required(),
  company_branch: fields.company_branch,
  status: fields.status.default('active'),
}).unknown(false);

const update = Joi.object({ ...fields }).min(1).unknown(false);

const params = Joi.object({
  companyId: id.required(),
});

const list = Joi.object({
  status: Joi.string().valid('active', 'inactive'),
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
}).unknown(false);

module.exports = { create, update, params, list };
