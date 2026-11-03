'use strict';

const { Model } = require('objection');

class ShiftSchedule extends Model {
  static get tableName() {
    return 'shift_schedules';
  }

  static get idColumn() {
    return 'schedule_id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['shift_id', 'day_of_week'],
      additionalProperties: false,
      properties: {
        schedule_id: { type: 'integer' },
        shift_id: { type: 'integer' },
        day_of_week: { type: 'integer', minimum: 1, maximum: 7 },
        is_working_day: { type: 'boolean' },
        check_in_time: { type: ['string', 'null'] },
        check_out_time: { type: ['string', 'null'] },
        status: { type: 'string', enum: ['active', 'inactive'] },
      },
    };
  }
}

module.exports = ShiftSchedule;
