'use strict';

const Boom = require('@hapi/boom');
const config = require('../config');

const COLOR_ONLY_FIELDS = ['color'];

const assertCanEdit = (data, scope) => {
  if (scope.role === config.roles.global) return;
  if (Object.keys(data).some((field) => !COLOR_ONLY_FIELDS.includes(field))) {
    throw Boom.forbidden('Solo el Superusuario puede cambiar estos datos; tú puedes elegir el color');
  }
};

module.exports = { assertCanEdit };
