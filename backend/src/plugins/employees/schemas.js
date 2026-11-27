'use strict';

const Joi = require('joi');
const config = require('../../config');
const { listOf, isoDate, pageSize } = require('../../lib/list-query');
const employeeFilter = require('../../lib/employee-filter');

const NAME_MIN = 3;
const NAME_MAX = 150;
const NAME_PATTERN = /^\p{L}[\p{L}\s.'-]*$/u;
const NUMBER_PATTERN = /^\d{4}$/;
const EMAIL_MAX = 120;

const id = Joi.number().integer().positive();

const idField = (missing) =>
  id.messages({
    'any.required': missing,
    'number.base': missing,
    'number.integer': missing,
    'number.positive': missing,
  });

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: config.timeZone });

const startDate = isoDate
  .custom((value, helpers) =>
    value > today() ? helpers.message({ custom: 'La fecha de ingreso no puede ser posterior a hoy' }) : value
  )
  .messages({
    'any.required': 'Indica la fecha de ingreso',
    'string.empty': 'Indica la fecha de ingreso',
    'string.base': 'La fecha de ingreso debe tener el formato AAAA-MM-DD',
  });

const MIN_AGE = 15;
const MAX_AGE = 100;

const yearsAgo = (years) => `${Number(today().slice(0, 4)) - years}${today().slice(4)}`;

const birthDate = isoDate
  .allow(null)
  .custom((value, helpers) =>
    value !== null && (value > yearsAgo(MIN_AGE) || value < yearsAgo(MAX_AGE))
      ? helpers.message({ custom: `La fecha de nacimiento no es válida: el empleado debe tener entre ${MIN_AGE} y ${MAX_AGE} años` })
      : value
  )
  .messages({
    'string.base': 'La fecha de nacimiento debe tener el formato AAAA-MM-DD',
    'string.empty': 'La fecha de nacimiento debe tener el formato AAAA-MM-DD',
  });

const email = Joi.string()
  .trim()
  .lowercase()
  .max(EMAIL_MAX)
  .email()
  .messages({
    'string.empty': 'Escribe el correo electrónico',
    'string.base': 'El correo electrónico debe ser texto',
    'string.email': 'El correo electrónico no es válido, por ejemplo nombre@empresa.com',
    'string.max': `El correo electrónico admite máximo ${EMAIL_MAX} caracteres`,
  });

const fields = {
  department_id: idField('Selecciona un departamento de la lista'),
  shift_id: idField('Selecciona un turno de la lista'),
  employee_number: Joi.string()
    .pattern(NUMBER_PATTERN)
    .messages({
      'any.required': 'Escribe el número de empleado',
      'string.empty': 'Escribe el número de empleado',
      'string.base': 'El número de empleado debe ser texto de 4 dígitos',
      'string.pattern.base': 'El número de empleado debe tener exactamente 4 dígitos, sin letras',
    }),
  employee_name: Joi.string()
    .trim()
    .min(NAME_MIN)
    .max(NAME_MAX)
    .pattern(NAME_PATTERN)
    .messages({
      'any.required': 'Escribe el nombre completo',
      'string.empty': 'Escribe el nombre completo',
      'string.base': 'El nombre debe ser texto',
      'string.min': `El nombre necesita al menos ${NAME_MIN} caracteres`,
      'string.max': `El nombre admite máximo ${NAME_MAX} caracteres`,
      'string.pattern.base': 'El nombre solo admite letras, espacios, puntos, apóstrofos y guiones',
    }),
  start_date: startDate,
  birth_date: birthDate,
  status: Joi.string().valid('active', 'inactive'),
};

const create = Joi.object({
  department_id: fields.department_id.required(),
  shift_id: fields.shift_id.required(),
  employee_number: fields.employee_number.required(),
  employee_name: fields.employee_name.required(),
  start_date: fields.start_date.required(),
  birth_date: fields.birth_date,
  status: fields.status.default('active'),
  email,
}).unknown(false);

const access = Joi.object({ email }).allow(null).unknown(false);

const update = Joi.object({ ...fields }).min(1).unknown(false);

const params = Joi.object({
  employeeId: id.required(),
});

const filters = {
  ...employeeFilter.schema,
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
