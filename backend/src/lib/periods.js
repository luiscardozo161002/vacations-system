'use strict';

const DAY_MS = 24 * 60 * 60 * 1000;
const REMINDER_DAYS = 7;

const toDate = (iso) => new Date(`${iso}T00:00:00Z`);
const toIso = (date) => date.toISOString().slice(0, 10);

const addDays = (iso, days) => toIso(new Date(toDate(iso).getTime() + days * DAY_MS));

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
    reminderFrom: addDays(nextAnniversary, -REMINDER_DAYS),
  };
};

module.exports = { REMINDER_DAYS, addDays, addYears, currentPeriod };
