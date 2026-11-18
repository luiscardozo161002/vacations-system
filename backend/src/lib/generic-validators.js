const Joi = require('joi');

class GenericValidator {
  positive(fallback) {
    return Joi.number().integer().positive().default(fallback);
  }

  decimal(fallback) {
    return Joi.number().positive().default(fallback);
  }

  text(fallback) {
    return Joi.string().trim().empty('').default(fallback);
  }

  flag(fallback) {
    return Joi.boolean().default(fallback);
  }

  list(fallback = []) {
    return Joi.string()
      .empty('')
      .custom((value) => value.split(',').map((item) => item.trim()).filter(Boolean))
      .default(fallback);
  }

  ip(fallback) {
    return Joi.string()
      .ip({ version: ['ipv4', 'ipv6'], cidr: 'forbidden' })
      .default(fallback);
  }
}

module.exports = new GenericValidator();
