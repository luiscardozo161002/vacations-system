const { Model } = require('objection');

class Employee extends Model {
  static get tableName() {
    return 'employees';
  }

  static get idColumn() {
    return 'employee_id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['department_id', 'shift_id', 'employee_number', 'employee_name', 'start_date'],
      additionalProperties: false,
      properties: {
        employee_id: { type: 'integer' },
        department_id: { type: 'integer' },
        shift_id: { type: 'integer' },
        employee_number: { type: 'string', pattern: '^\\d{4}$' },
        employee_name: { type: 'string', maxLength: 150 },
        start_date: { type: 'string', format: 'date' },
        birth_date: { type: ['string', 'null'], format: 'date' },
        status: { type: 'string', enum: ['active', 'inactive'] },
        created_at: { type: 'string' },
        updated_at: { type: 'string' },
      },
    };
  }


}

module.exports = Employee;
