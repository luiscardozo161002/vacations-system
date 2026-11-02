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
      required: ['department_id', 'shift_id', 'folio', 'employee_number', 'employee_name', 'start_date'],
      additionalProperties: false,
      properties: {
        employee_id: { type: 'integer' },
        department_id: { type: 'integer' },
        shift_id: { type: 'integer' },
        folio: { type: 'string', maxLength: 10 },
        employee_number: { type: 'string', maxLength: 20 },
        employee_name: { type: 'string', maxLength: 150 },
        start_date: { type: 'string', format: 'date' },
        status: { type: 'string', enum: ['active', 'inactive'] },
        created_at: { type: 'string' },
        updated_at: { type: 'string' },
      },
    };
  }


}

module.exports = Employee;
