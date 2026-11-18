const Joi = require('joi');

class GenericValidator {
  positive(fallback) {
    return Joi.number().integer().positive().default(fallback);
  }

  decimal(fallback) {
    return Joi.number().positive().default(fallback);
  }

  list(fallback = []) {
    return Joi.string()
      .empty('')
      .custom((value) => value.split(',').map((item) => item.trim()).filter(Boolean))
      .default(fallback);
  }
}

module.exports = new GenericValidator();
