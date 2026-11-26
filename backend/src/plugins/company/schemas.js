'use strict';

const Joi = require('joi');
const { pageSize, hexColor } = require('../../lib/list-query');

const FOLIO_PATTERN = /^[A-Z0-9]{2,15}$/;
const RFC_PATTERN = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
const NAME_MIN = 3;
const NAME_MAX = 150;
const TEXT_MAX = 255;
const PHONE_MAX = 20;

const id = Joi.number().integer().positive();

const nullableText = (message, max) =>
  Joi.string()
    .trim()
    .max(max)
    .allow(null, '')
    .messages({ 'string.max': `${message} admite máximo ${max} caracteres`, 'string.base': `${message} debe ser texto` });

const fields = {
  folio: Joi.string()
    .trim()
    .uppercase()
    .pattern(FOLIO_PATTERN)
    .messages({
      'any.required': 'Escribe el folio de la empresa',
      'string.empty': 'Escribe el folio de la empresa',
      'string.base': 'El folio debe ser texto',
      'string.pattern.base': 'El folio solo admite letras y números, de 2 a 15 caracteres, sin espacios',
    }),
  company_name: Joi.string()
    .trim()
    .min(NAME_MIN)
    .max(NAME_MAX)
    .messages({
      'any.required': 'Escribe la razón social',
      'string.empty': 'Escribe la razón social',
      'string.base': 'La razón social debe ser texto',
      'string.min': `La razón social necesita al menos ${NAME_MIN} caracteres`,
      'string.max': `La razón social admite máximo ${NAME_MAX} caracteres`,
    }),
  logo: Joi.string()
    .trim()
    .max(TEXT_MAX)
    .uri({ scheme: ['http', 'https'] })
    .allow(null, '')
    .messages({
      'string.uri': 'El logotipo debe ser una dirección web que empiece con http:// o https://',
      'string.uriCustomScheme': 'El logotipo debe ser una dirección web que empiece con http:// o https://',
      'string.max': `El logotipo admite máximo ${TEXT_MAX} caracteres`,
      'string.base': 'El logotipo debe ser texto',
    }),
  location: nullableText('La dirección', TEXT_MAX),
  phone_number: nullableText('El teléfono', PHONE_MAX),
  rfc: Joi.string()
    .trim()
    .uppercase()
    .pattern(RFC_PATTERN)
    .allow(null, '')
    .messages({
      'string.pattern.base': 'El RFC no es válido, por ejemplo THH981218DS0 (3 o 4 letras, 6 dígitos y 3 caracteres)',
      'string.base': 'El RFC debe ser texto',
    }),
  color: hexColor,
  status: Joi.string().valid('active', 'inactive'),
};

const create = Joi.object({
  folio: fields.folio.required(),
  company_name: fields.company_name.required(),
  logo: fields.logo,
  location: fields.location,
  phone_number: fields.phone_number,
  rfc: fields.rfc,
  color: fields.color,
  status: fields.status.default('active'),
}).unknown(false);

const update = Joi.object({ ...fields }).min(1).unknown(false);

const params = Joi.object({
  companyId: id.required(),
});

const list = Joi.object({
  status: Joi.string().valid('active', 'inactive'),
  sort: Joi.string(),
  page: Joi.number().integer().min(1).default(1),
  pageSize,
}).unknown(false);

module.exports = { create, update, params, list };
