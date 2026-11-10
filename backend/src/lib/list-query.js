'use strict';

const Boom = require('@hapi/boom');

const buildOrderBy = (sort, allowedFields, defaultSort) => {
  if (!sort) return defaultSort;

  return sort.split(',').map((field) => {
    const column = field.startsWith('-') ? field.slice(1) : field;

    if (!allowedFields.includes(column)) {
      throw Boom.badRequest(`No se puede ordenar por "${column}"`);
    }

    return { column, order: field.startsWith('-') ? 'desc' : 'asc' };
  });
};

const paginationMeta = (page, pageSize, total) => ({
  page,
  pageSize,
  total,
  totalPages: Math.ceil(total / pageSize),
});

module.exports = { buildOrderBy, paginationMeta };
