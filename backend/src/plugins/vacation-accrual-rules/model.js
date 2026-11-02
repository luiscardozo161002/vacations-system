'use strict';

const { Model } = require('objection');

class VacationAccrualRule extends Model {
  static get tableName() {
    return 'vacation_accrual_rules';
  }

  static get idColumn() {
    return 'rule_id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['years_from', 'vacation_days', 'effective_year'],
      additionalProperties: false,
      properties: {
        rule_id: { type: 'integer' },
        years_from: { type: 'integer' },
        years_to: { type: ['integer', 'null'] },
        vacation_days: { type: 'integer' },
        effective_year: { type: 'integer' },
        status: { type: 'string', enum: ['active', 'inactive'] },
        created_at: { type: 'string' },
      },
    };
  }
}

module.exports = VacationAccrualRule;
