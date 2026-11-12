'use strict';

const DEFAULT_DAILY_HOURS = 8;
const DAY_MS = 24 * 60 * 60 * 1000;

const toHours = (time) => {
  const [hours, minutes = 0] = time.split(':').map(Number);
  return hours + minutes / 60;
};

const round2 = (value) => Math.round(value * 100) / 100;

const datesBetween = (startDate, endDate) => {
  const dates = [];
  const end = Date.parse(`${endDate}T00:00:00Z`);
  for (let time = Date.parse(`${startDate}T00:00:00Z`); time <= end; time += DAY_MS) {
    dates.push(new Date(time));
  }
  return dates;
};

const isoWeekday = (date) => date.getUTCDay() || 7;

const workingBlock = (schedule, date) => {
  const day = schedule.find((entry) => entry.day_of_week === isoWeekday(date));
  if (!day || !day.is_working_day || !day.check_in_time || !day.check_out_time) return null;
  return { start: toHours(day.check_in_time), end: toHours(day.check_out_time) };
};

const shiftDailyHours = (schedule) => {
  const firstWorkingDay = [...schedule]
    .sort((a, b) => a.day_of_week - b.day_of_week)
    .find((day) => day.is_working_day && day.check_in_time && day.check_out_time);
  if (!firstWorkingDay) return DEFAULT_DAILY_HOURS;
  return toHours(firstWorkingDay.check_out_time) - toHours(firstWorkingDay.check_in_time);
};

const computeRequestBreakdown = ({ schedule, startDate, endDate, startTime = null, endTime = null }) => {
  const dates = datesBetween(startDate, endDate);
  const startHour = startTime ? toHours(startTime) : null;
  const endHour = endTime ? toHours(endTime) : null;
  const dailyHours = shiftDailyHours(schedule);

  let fullDays = 0;
  let partialHours = 0;
  let restDays = 0;

  dates.forEach((date, index) => {
    const block = workingBlock(schedule, date);
    if (!block) {
      restDays += 1;
      return;
    }

    const dayHours = block.end - block.start;
    const isFirst = index === 0;
    const isLast = index === dates.length - 1;
    const from = isFirst && startHour !== null ? Math.max(startHour, block.start) : block.start;
    const to = isLast && endHour !== null ? Math.min(endHour, block.end) : block.end;
    const hours = Math.max(0, to - from);

    if (hours >= dayHours) fullDays += 1;
    else partialHours += hours;
  });

  fullDays += Math.floor(partialHours / dailyHours);

  return {
    fullDays,
    partialHours: round2(partialHours % dailyHours),
    restDays,
    dailyHours,
  };
};

module.exports = { computeRequestBreakdown, shiftDailyHours };
