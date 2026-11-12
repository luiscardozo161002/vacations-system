'use strict';

const field = 'El campo {{#label}}';

const VALIDATION_MESSAGES = {
  'any.required': `${field} es obligatorio`,
  'any.only': `${field} debe ser uno de: {{#valids}}`,
  'any.invalid': `${field} no tiene un valor válido`,
  'object.unknown': `${field} no está permitido`,
  'object.base': 'El cuerpo de la petición debe ser un objeto',
  'object.min': 'Envía al menos un campo',
  'object.xor': 'Envía solo uno de estos campos: {{#peers}}',
  'object.missing': 'Envía uno de estos campos: {{#peers}}',
  'string.base': `${field} debe ser texto`,
  'string.empty': `${field} no puede estar vacío`,
  'string.min': `${field} necesita al menos {{#limit}} caracteres`,
  'string.max': `${field} admite máximo {{#limit}} caracteres`,
  'string.email': `${field} debe ser un correo válido`,
  'string.isoDate': `${field} debe ser una fecha válida`,
  'string.pattern.base': `${field} no tiene el formato correcto`,
  'number.base': `${field} debe ser un número`,
  'number.integer': `${field} debe ser un número entero`,
  'number.min': `${field} debe ser mayor o igual a {{#limit}}`,
  'number.max': `${field} debe ser menor o igual a {{#limit}}`,
  'number.positive': `${field} debe ser mayor que cero`,
  'number.precision': `${field} admite máximo {{#limit}} decimales`,
  'boolean.base': `${field} debe ser verdadero o falso`,
  'array.base': `${field} debe ser una lista`,
  'array.length': 'La lista debe tener {{#limit}} elementos',
  'array.min': 'La lista debe tener al menos {{#limit}} elementos',
  'array.max': 'La lista admite máximo {{#limit}} elementos',
  'array.unique': `${field} tiene valores repetidos`,
  'date.base': `${field} debe ser una fecha válida`,
};

module.exports = { VALIDATION_MESSAGES };
