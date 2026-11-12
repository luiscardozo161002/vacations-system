'use strict';

const { Model } = require('objection');

class Notice extends Model {
  static get tableName() {
    return 'notices';
  }

  static get idColumn() {
    return 'notice_id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['employee_id', 'reason_id', 'absence_start_date', 'absence_end_date'],
      additionalProperties: false,
      properties: {
        notice_id: { type: 'integer' },
        employee_id: { type: 'integer' },
        kind: { type: 'string', enum: ['request', 'notice'] },
        created_by: { type: ['integer', 'null'] },
        reason_id: { type: 'integer' },
        approved_by: { type: ['integer', 'null'] },
        status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'cancelled'] },
        absence_start_date: { type: 'string', format: 'date' },
        absence_end_date: { type: 'string', format: 'date' },
        absence_start_time: { type: ['string', 'null'] },
        absence_end_time: { type: ['string', 'null'] },
        days_taken: { type: 'integer' },
        hours_taken: { type: 'number' },
        entitlement_id: { type: ['integer', 'null'] },
        remarks: { type: ['string', 'null'], maxLength: 255 },
        request_date: { type: 'string' },
        approved_at: { type: ['string', 'null'] },
      },
    };
  }
}

module.exports = Notice;
