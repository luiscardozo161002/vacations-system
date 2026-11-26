const db = require('../../db');
const config = require('../../config');
const { AppError } = require('../../lib/app-error');
const DataScope = require('../../lib/data-scope');
const notices = require('../notices/service');
const entitlements = require('../vacation-entitlements/service');
const { holidaysBetween } = require('../../lib/holidays');

const { upcomingDays, listLimit, myListLimit } = config.dashboard;
const TODAY = db.raw('CURRENT_DATE');
const MONTHS_BACK = 6;

class DashboardService {
  constructor({ notices, entitlements }) {
    this.notices = notices;
    this.entitlements = entitlements;
  }

  async count(query) {
    return Number((await query.count('* as total').first()).total);
  }

  scopedNotices(scope) {
    return scope.restrictEmployees(db('notices as n'), 'n.employee_id');
  }

  withNames(query) {
    return query
      .join('employees as e', 'e.employee_id', 'n.employee_id')
      .join('departments as d', 'd.department_id', 'e.department_id')
      .join('reasons as r', 'r.reason_id', 'n.reason_id');
  }

  departmentsWithEmployees(scope) {
    return scope
      .restrictDepartments(db('departments as d'), 'd.department_id')
      .join('branches as b', 'b.branch_id', 'd.branch_id')
      .join('company as c', 'c.company_id', 'b.company_id')
      .leftJoin('employees as e', (join) => join.on('e.department_id', 'd.department_id').andOnVal('e.status', 'active'))
      .where('d.status', 'active')
      .groupBy('d.department_id', 'd.department_name', 'b.code', 'b.color', 'c.color')
      .orderBy(['d.department_name', 'b.code'])
      .select(
        'd.department_id',
        'd.department_name',
        'b.code as branch_code',
        db.raw('COALESCE(b.color, c.color) AS color'),
        db.raw('COUNT(e.employee_id)::int AS active_employees')
      );
  }

  async absencesByMonth(scope) {
    const rows = await this.scopedNotices(scope)
      .where('n.status', 'approved')
      .where('n.absence_start_date', '>=', db.raw(`date_trunc('month', CURRENT_DATE) - ?::integer * interval '1 month'`, [MONTHS_BACK - 1]))
      .groupByRaw(`to_char(n.absence_start_date, 'YYYY-MM')`)
      .select(db.raw(`to_char(n.absence_start_date, 'YYYY-MM') AS month`), db.raw('COUNT(*)::int AS absences'));
    const countOf = new Map(rows.map((row) => [row.month, row.absences]));
    const { month: current } = await db.first(db.raw(`to_char(CURRENT_DATE, 'YYYY-MM') AS month`));
    const [year, number] = current.split('-').map(Number);

    return Array.from({ length: MONTHS_BACK }, (_, index) => {
      const date = new Date(Date.UTC(year, number - 1 - (MONTHS_BACK - 1 - index), 1));
      const month = date.toISOString().slice(0, 7);
      return { month, absences: countOf.get(month) ?? 0 };
    });
  }

  absencesByReason(scope) {
    return this.withNames(this.scopedNotices(scope))
      .whereIn('n.status', ['approved', 'pending'])
      .where('n.absence_start_date', '>=', db.raw(`date_trunc('year', CURRENT_DATE)`))
      .groupBy('r.reason_id', 'r.description')
      .orderBy([{ column: 'absences', order: 'desc' }, 'r.description'])
      .select('r.description as reason_description', db.raw('COUNT(*)::int AS absences'));
  }

  upcomingAbsences(scope) {
    return this.withNames(this.scopedNotices(scope))
      .where('n.status', 'approved')
      .where('n.absence_end_date', '>=', TODAY)
      .orderBy('n.absence_start_date')
      .limit(listLimit)
      .select(
        'n.notice_id',
        'e.employee_name',
        'd.department_name',
        'r.description as reason_description',
        'n.absence_start_date',
        'n.absence_end_date',
        'n.days_taken',
        'n.hours_taken'
      );
  }

  recentActivity(scope) {
    return this.withNames(this.scopedNotices(scope))
      .orderBy('happened_at', 'desc')
      .limit(listLimit)
      .select(
        'n.notice_id',
        'n.kind',
        'n.status',
        'e.employee_name',
        'r.description as reason_description',
        db.raw('COALESCE(n.approved_at, n.request_date) AS happened_at')
      );
  }

  async countAbsentToday(scope) {
    const { today } = await db.first(db.raw("to_char(CURRENT_DATE, 'YYYY-MM-DD') AS today"));
    if (holidaysBetween(today, today).length) return 0;

    const row = await this.scopedNotices(scope)
      .join('employees as e', 'e.employee_id', 'n.employee_id')
      .join('shift_schedules as ss', (join) =>
        join.on('ss.shift_id', 'e.shift_id').andOn('ss.day_of_week', db.raw('EXTRACT(ISODOW FROM CURRENT_DATE)'))
      )
      .where('ss.is_working_day', true)
      .where('n.status', 'approved')
      .where('n.absence_start_date', '<=', TODAY)
      .where('n.absence_end_date', '>=', TODAY)
      .countDistinct('n.employee_id as total')
      .first();
    return Number(row.total);
  }

  countUpcomingVacations(scope) {
    return this.count(
      this.scopedNotices(scope)
        .join('reasons as r', 'r.reason_id', 'n.reason_id')
        .where('r.affects_vacation_balance', true)
        .where('n.status', 'approved')
        .whereBetween('n.absence_start_date', [TODAY, db.raw('CURRENT_DATE + ?::integer', [upcomingDays])])
    );
  }

  async teamSummary(scope) {
    const [activeEmployees, absentToday, pendingRequests, upcomingVacations, absences, departments, activity, byMonth, byReason] =
      await Promise.all([
        this.count(scope.restrictEmployees(db('employees'), 'employee_id').where('status', 'active')),
        this.countAbsentToday(scope),
        this.count(this.scopedNotices(scope).where({ 'n.kind': 'request', 'n.status': 'pending' })),
        this.countUpcomingVacations(scope),
        this.upcomingAbsences(scope),
        this.departmentsWithEmployees(scope),
        this.recentActivity(scope),
        this.absencesByMonth(scope),
        this.absencesByReason(scope),
      ]);

    return {
      active_employees: activeEmployees,
      absent_today: absentToday,
      pending_requests: pendingRequests,
      upcoming_vacations: upcomingVacations,
      upcoming_absences: absences,
      by_department: departments,
      by_month: byMonth,
      by_reason: byReason,
      recent_activity: activity,
    };
  }

  findMyProfile(employeeId) {
    return db('employees as e')
      .join('departments as d', 'd.department_id', 'e.department_id')
      .join('shifts as s', 's.shift_id', 'e.shift_id')
      .where('e.employee_id', employeeId)
      .first(
        'e.employee_id',
        'e.employee_name',
        'e.employee_number',
        'e.start_date',
        'd.department_name',
        's.shift_name',
        db.raw('EXTRACT(YEAR FROM age(CURRENT_DATE, e.start_date))::int AS years_of_service')
      );
  }

  async mySummary(scope) {
    if (!scope.employeeId) throw new AppError('EMPLOYEE_NOT_FOUND', 'Tu usuario no tiene un empleado vinculado');

    const own = new DataScope({ role: 'EMPLOYEE', branchIds: [], employeeId: scope.employeeId });
    const recent = { sort: '-request_date', page: 1, pageSize: myListLimit };
    const [profile, balances, requests, registered] = await Promise.all([
      this.findMyProfile(scope.employeeId),
      this.entitlements.list({ status: 'active', page: 1, pageSize: 1, sort: '-period_start' }, own),
      this.notices.list({ ...recent, kind: 'request' }, own),
      this.notices.list({ ...recent, kind: 'notice' }, own),
    ]);

    return {
      profile,
      balance: balances.data[0] ?? null,
      requests: requests.data,
      notices: registered.data,
    };
  }
}

module.exports = new DashboardService({ notices, entitlements });
