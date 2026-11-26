'use strict';

const Joi = require('joi');
const { pageSize, hexColor } = require('../../lib/list-query');

const CODE_PATTERN = /^[A-Z0-9_]{2,20}$/;
const NAME_MIN = 2;
const NAME_MAX = 100;

const id = Joi.number().integer().positive();

const fields = {
  company_id: id.messages({
    'any.required': 'Selecciona una empresa de la lista',
    'number.base': 'Selecciona una empresa de la lista',
    'number.integer': 'Selecciona una empresa de la lista',
    'number.positive': 'Selecciona una empresa de la lista',
  }),
  code: Joi.string()
    .trim()
    .uppercase()
    .pattern(CODE_PATTERN)
    .messages({
      'any.required': 'Escribe el código de la sede',
      'string.empty': 'Escribe el código de la sede',
      'string.base': 'El código debe ser texto',
      'string.pattern.base': 'El código solo admite letras, números y guion bajo, de 2 a 20 caracteres, por ejemplo THH_HGO',
    }),
  branch_name: Joi.string()
    .trim()
    .min(NAME_MIN)
    .max(NAME_MAX)
    .messages({
      'any.required': 'Escribe el nombre de la sede',
      'string.empty': 'Escribe el nombre de la sede',
      'string.base': 'El nombre debe ser texto',
      'string.min': `El nombre necesita al menos ${NAME_MIN} caracteres`,
      'string.max': `El nombre admite máximo ${NAME_MAX} caracteres`,
    }),
  color: hexColor,
  status: Joi.string().valid('active', 'inactive'),
};

const create = Joi.object({
  company_id: fields.company_id.required(),
  code: fields.code.required(),
  branch_name: fields.branch_name.required(),
  color: fields.color,
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
  pageSize,
}).unknown(false);

module.exports = { create, update, params, list };
