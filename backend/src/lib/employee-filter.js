'use strict';

const Joi = require('joi');
const db = require('../db');
const { listOf, whereAnyOf } = require('./list-query');

const id = Joi.number().integer().positive();

const schema = {
  search: Joi.string().trim().max(100),
  company_id: listOf(id),
  branch_id: listOf(id),
  department_id: listOf(id),
};

const FILTER_KEYS = Object.keys(schema);

const matchingEmployees = ({ search, company_id, branch_id, department_id }) => {
  const query = db('employees as e')
    .join('departments as d', 'd.department_id', 'e.department_id')
    .join('branches as b', 'b.branch_id', 'd.branch_id')
    .select('e.employee_id');

  if (search) {
    query.where((match) =>
      match.whereILike('e.employee_name', `%${search}%`).orWhereILike('e.employee_number', `%${search}%`)
    );
  }
  whereAnyOf(query, 'b.company_id', company_id);
  whereAnyOf(query, 'd.branch_id', branch_id);
  whereAnyOf(query, 'e.department_id', department_id);
  return query;
};

const whereEmployee = (query, column, filters) => {
  if (FILTER_KEYS.some((key) => filters[key] !== undefined)) query.whereIn(column, matchingEmployees(filters));
  return query;
};

module.exports = { schema, whereEmployee };
