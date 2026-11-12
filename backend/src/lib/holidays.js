'use strict';

const FIRST_TRANSFER_YEAR = 2024;
const TRANSFER_EVERY_YEARS = 6;
const MONDAY = 1;

const pad = (value) => String(value).padStart(2, '0');

const isoDate = (year, month, day) => `${year}-${pad(month)}-${pad(day)}`;

const nthMonday = (year, month, nth) => {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const firstMonday = 1 + ((MONDAY - firstWeekday + 7) % 7);
  return isoDate(year, month, firstMonday + (nth - 1) * 7);
};

const isTransferYear = (year) => year >= FIRST_TRANSFER_YEAR && (year - FIRST_TRANSFER_YEAR) % TRANSFER_EVERY_YEARS === 0;

const holidaysOfYear = (year) =>
  [
    { date: isoDate(year, 1, 1), name: 'Año Nuevo' },
    { date: nthMonday(year, 2, 1), name: 'Día de la Constitución' },
    { date: nthMonday(year, 3, 3), name: 'Natalicio de Benito Juárez' },
    { date: isoDate(year, 5, 1), name: 'Día del Trabajo' },
    { date: isoDate(year, 9, 16), name: 'Día de la Independencia' },
    isTransferYear(year) && { date: isoDate(year, 10, 1), name: 'Transmisión del Poder Ejecutivo Federal' },
    { date: nthMonday(year, 11, 3), name: 'Día de la Revolución' },
    { date: isoDate(year, 12, 25), name: 'Navidad' },
  ].filter(Boolean);

const holidaysBetween = (startDate, endDate) => {
  const holidays = [];
  for (let year = Number(startDate.slice(0, 4)); year <= Number(endDate.slice(0, 4)); year += 1) {
    holidays.push(...holidaysOfYear(year).filter((holiday) => holiday.date >= startDate && holiday.date <= endDate));
  }
  return holidays;
};

module.exports = { holidaysOfYear, holidaysBetween };
