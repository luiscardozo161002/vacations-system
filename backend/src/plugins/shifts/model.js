'use strict';

const { Model } = require('objection');

class Shift extends Model {
  static get tableName() {
    return 'shifts';
  }

  static get idColumn() {
    return 'shift_id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['code', 'shift_name', 'number_days'],
      additionalProperties: false,
      properties: {
        shift_id: { type: 'integer' },
        code: { type: 'string', maxLength: 20 },
        shift_name: { type: 'string', maxLength: 100 },
        number_days: { type: 'integer' },
        status: { type: 'string', enum: ['active', 'inactive'] },
        created_at: { type: 'string' },
        updated_at: { type: 'string' },
      },
    };
  }
}

module.exports = Shift;
