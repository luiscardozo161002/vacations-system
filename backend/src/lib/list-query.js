'use strict';

const Boom = require('@hapi/boom');
const Joi = require('joi');
const db = require('../db');

const ListJoi = Joi.extend({
  type: 'array',
  base: Joi.array(),
  coerce: { from: 'string', method: (value) => ({ value: value.split(',').map((part) => part.trim()) }) },
});

const listOf = (item) => ListJoi.array().items(item).min(1);

const isoDate = Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .message('El formato es AAAA-MM-DD')
  .custom((value, helpers) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (value.startsWith('0000-') || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
      return helpers.message({ custom: 'La fecha debe ser válida' });
    }
    return value;
  });

const whereAnyOf = (query, column, values) => (values === undefined ? query : query.whereIn(column, [values].flat()));

const whereDateBetween = (query, column, from, to) => {
  if (from !== undefined) query.where(column, '>=', from);
  if (to !== undefined) query.where(column, '<', db.raw('?::date + 1', [to]));
  return query;
};

const buildOrderBy = (sort, allowedFields, defaultSort) => {
  if (!sort) return defaultSort;

  return sort.split(',').map((field) => {
    const descending = field.startsWith('-');
    const column = descending ? field.slice(1) : field;

    if (!allowedFields.includes(column)) {
      throw Boom.badRequest(`No se puede ordenar por "${column}"`);
    }

    return { column, order: descending ? 'desc' : 'asc' };
  });
};

const paginationMeta = (page, pageSize, total) => ({
  page,
  pageSize,
  total,
  totalPages: Math.ceil(total / pageSize),
});

module.exports = { buildOrderBy, paginationMeta, listOf, isoDate, whereAnyOf, whereDateBetween };
