'use strict';

const Joi = require('joi');
const { hexColor } = require('../../lib/list-query');

const MIN_ALPHA = 0.4;

const update = Joi.object({
  theme: Joi.string().valid('light', 'dark').allow(null),
  backdrop_light: hexColor,
  backdrop_dark: hexColor,
  button_color: hexColor,
  window_alpha: Joi.number().min(MIN_ALPHA).max(1).precision(2).allow(null),
})
  .min(1)
  .unknown(false);

module.exports = { update };
