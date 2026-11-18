const db = require('../../db');
const config = require('../../config');
const { AppError } = require('../../lib/app-error');
const { holidaysBetween } = require('../../lib/holidays');
const { workingDates } = require('../../lib/request-breakdown');

const MAX_RANGE_DAYS = 62;

class CalendarService {
  rangeDays(from, to) {
    return (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / config.time.dayMs + 1;
  }

  sharedDepartmentMates(employeeId) {
    return db('employees as mate')
      .join('departments as dept', 'dept.department_id', 'mate.department_id')
      .where('dept.calendar_shared', true)
      .where('mate.department_id', db('employees').where('employee_id', employeeId).select('department_id'))
      .select('mate.employee_id');
  }

  visibleTo(query, scope) {
    if (scope.role !== 'EMPLOYEE') return scope.restrictEmployees(query, 'n.employee_id');
    return query.where((own) =>
      own
        .where('n.employee_id', scope.employeeId)
        .orWhereIn('n.employee_id', this.sharedDepartmentMates(scope.employeeId))
    );
  }

  findAbsences(from, to, scope) {
    const query = db('notices as n')
      .join('employees as e', 'e.employee_id', 'n.employee_id')
      .join('departments as d', 'd.department_id', 'e.department_id')
      .join('reasons as r', 'r.reason_id', 'n.reason_id')
      .whereIn('n.status', ['approved', 'pending'])
      .where('n.absence_end_date', '>=', from)
      .where('n.absence_start_date', '<=', to)
      .orderBy(['n.absence_start_date', 'e.employee_name'])
      .select(
        'n.notice_id',
        'n.employee_id',
        'e.shift_id',
        'e.employee_name',
        'd.department_name',
        'r.description as reason_description',
        'n.kind',
        'n.status',
        'n.absence_start_date',
        'n.absence_end_date',
        'n.absence_start_time',
        'n.absence_end_time'
      );
    return this.visibleTo(query, scope);
  }

  async getCalendar({ from, to }, scope) {
    if (to < from) throw new AppError('INVALID_RANGE', 'La fecha final debe ser igual o posterior a la inicial');
    if (this.rangeDays(from, to) > MAX_RANGE_DAYS) {
      throw new AppError('RANGE_TOO_LONG', `El rango admite máximo ${MAX_RANGE_DAYS} días`);
    }

    const holidays = holidaysBetween(from, to);
    const absences = await this.findAbsences(from, to, scope);
    const schedules = await db('shift_schedules')
      .whereIn('shift_id', [...new Set(absences.map((absence) => absence.shift_id))])
      .select('shift_id', 'day_of_week', 'is_working_day', 'check_in_time', 'check_out_time');

    return {
      from,
      to,
      holidays,
      absences: absences
        .map(({ shift_id, ...absence }) => ({
          ...absence,
          dates: workingDates({
            schedule: schedules.filter((day) => day.shift_id === shift_id),
            startDate: absence.absence_start_date < from ? from : absence.absence_start_date,
            endDate: absence.absence_end_date > to ? to : absence.absence_end_date,
            holidays: holidays.map((holiday) => holiday.date),
          }),
        }))
        .filter((absence) => absence.dates.length > 0),
    };
  }
}

module.exports = new CalendarService();
