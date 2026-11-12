'use strict';

const { Model } = require('objection');

class Department extends Model {
  static get tableName() {
    return 'departments';
  }

  static get idColumn() {
    return 'department_id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['branch_id', 'code', 'department_name'],
      additionalProperties: false,
      properties: {
        department_id: { type: 'integer' },
        branch_id: { type: 'integer' },
        code: { type: 'string', maxLength: 20 },
        department_name: { type: 'string', maxLength: 150 },
        manager_employee_id: { type: ['integer', 'null'] },
        calendar_shared: { type: 'boolean' },
        status: { type: 'string', enum: ['active', 'inactive'] },
        created_at: { type: 'string' },
        updated_at: { type: 'string' },
      },
    };
  }
}

module.exports = Department;
