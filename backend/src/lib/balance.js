'use strict';

const EPSILON = 1e-6;

const round2 = (value) => Math.round(value * 100) / 100;

const toTotalHours = (days, hours, dailyHours) => days * dailyHours + Number(hours);

const splitHours = (totalHours, dailyHours) => {
  const days = Math.floor((totalHours + EPSILON) / dailyHours);
  return { days, hours: round2(Math.max(0, totalHours - days * dailyHours)) };
};

const describe = ({ days, hours }) => {
  const parts = [`${days} ${days === 1 ? 'día' : 'días'}`];
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hora' : 'horas'}`);
  return parts.join(' y ');
};

module.exports = { EPSILON, toTotalHours, splitHours, describe };
