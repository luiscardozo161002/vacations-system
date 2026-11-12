'use strict';

const { Model } = require('objection');

class Company extends Model {
  static get tableName() {
    return 'company';
  }

  static get idColumn() {
    return 'company_id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['folio', 'company_name'],
      additionalProperties: false,
      properties: {
        company_id: { type: 'integer' },
        folio: { type: 'string', maxLength: 15 },
        company_name: { type: 'string', maxLength: 150 },
        logo: { type: ['string', 'null'], maxLength: 255 },
        location: { type: ['string', 'null'], maxLength: 255 },
        phone_number: { type: ['string', 'null'], maxLength: 20 },
        rfc: { type: ['string', 'null'], maxLength: 13 },
        status: { type: 'string', enum: ['active', 'inactive'] },
        created_at: { type: 'string' },
        updated_at: { type: 'string' },
      },
    };
  }
}

module.exports = Company;
