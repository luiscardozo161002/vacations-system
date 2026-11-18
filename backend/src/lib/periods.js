'use strict';

const config = require('../config');

const { dayMs } = config.time;
const { reminderDays } = config.work;

const toDate = (iso) => new Date(`${iso}T00:00:00Z`);
const toIso = (date) => date.toISOString().slice(0, 10);

const addDays = (iso, days) => toIso(new Date(toDate(iso).getTime() + days * dayMs));

const addYears = (iso, years) => {
  const [year, month, day] = iso.split('-').map(Number);
  return toIso(new Date(Date.UTC(year + years, month - 1, day)));
};

const currentPeriod = (startDate, today) => {
  let years = Number(today.slice(0, 4)) - Number(startDate.slice(0, 4));
  if (addYears(startDate, years) > today) years -= 1;
  if (years < 1) return null;

  const nextAnniversary = addYears(startDate, years + 1);
  return {
    yearsOfService: years,
    start: addYears(startDate, years),
    end: addDays(nextAnniversary, -1),
    reminderFrom: addDays(nextAnniversary, -reminderDays),
  };
};

module.exports = { addDays, addYears, currentPeriod };
