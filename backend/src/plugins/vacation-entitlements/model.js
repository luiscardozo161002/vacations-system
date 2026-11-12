'use strict';

const { Model } = require('objection');

class VacationEntitlement extends Model {
  static get tableName() {
    return 'vacation_entitlements';
  }

  static get idColumn() {
    return 'entitlement_id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['employee_id', 'period_year', 'years_of_service', 'rule_id', 'total_days', 'period_start', 'period_end'],
      additionalProperties: false,
      properties: {
        entitlement_id: { type: 'integer' },
        employee_id: { type: 'integer' },
        period_year: { type: 'integer' },
        years_of_service: { type: 'integer' },
        rule_id: { type: 'integer' },
        total_days: { type: 'integer' },
        used_days: { type: 'integer' },
        used_hours: { type: 'number' },
        period_start: { type: 'string', format: 'date' },
        period_end: { type: 'string', format: 'date' },
        remaining_days: { type: 'integer' },
        generated_at: { type: 'string' },
        status: { type: 'string', enum: ['active', 'inactive'] },
      },
    };
  }
}

module.exports = VacationEntitlement;
