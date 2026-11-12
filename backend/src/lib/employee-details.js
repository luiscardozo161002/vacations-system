'use strict';

const db = require('../db');
const { shiftDailyHours } = require('./request-breakdown');

const unique = (values) => [...new Set(values)];

const findEmployeeDetails = async (employeeIds) => {
  const employees = await db('employees as e')
    .join('departments as d', 'd.department_id', 'e.department_id')
    .whereIn('e.employee_id', unique(employeeIds))
    .select('e.employee_id', 'e.employee_name', 'e.employee_number', 'e.shift_id', 'd.department_name');

  const schedules = await db('shift_schedules')
    .whereIn('shift_id', unique(employees.map((employee) => employee.shift_id)))
    .select('shift_id', 'day_of_week', 'is_working_day', 'check_in_time', 'check_out_time');

  return new Map(
    employees.map(({ shift_id, ...employee }) => [
      employee.employee_id,
      { ...employee, daily_hours: shiftDailyHours(schedules.filter((day) => day.shift_id === shift_id)) },
    ])
  );
};

module.exports = { findEmployeeDetails };
