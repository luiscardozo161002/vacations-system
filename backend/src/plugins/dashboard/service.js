'use strict';

const db = require('../../db');
const { AppError } = require('../../lib/app-error');
const { forEmployees, inDepartments } = require('../../lib/data-scope');
const notices = require('../notices/service');
const entitlements = require('../vacation-entitlements/service');

const UPCOMING_DAYS = 30;
const LIST_LIMIT = 4;
const MY_LIST_LIMIT = 5;
const TODAY = db.raw('CURRENT_DATE');

const count = async (query) => Number((await query.count('* as total').first()).total);

const scopedNotices = (scope) => forEmployees(db('notices as n'), scope, 'n.employee_id');

const withNames = (query) =>
  query
    .join('employees as e', 'e.employee_id', 'n.employee_id')
    .join('departments as d', 'd.department_id', 'e.department_id')
    .join('reasons as r', 'r.reason_id', 'n.reason_id');

const departmentsWithEmployees = (scope) =>
  inDepartments(db('departments as d'), scope, 'd.department_id')
    .join('branches as b', 'b.branch_id', 'd.branch_id')
    .leftJoin('employees as e', (join) => join.on('e.department_id', 'd.department_id').andOnVal('e.status', 'active'))
    .where('d.status', 'active')
    .groupBy('d.department_id', 'd.department_name', 'b.code')
    .orderBy(['d.department_name', 'b.code'])
    .select('d.department_id', 'd.department_name', 'b.code as branch_code', db.raw('COUNT(e.employee_id)::int AS active_employees'));

const upcomingAbsences = (scope) =>
  withNames(scopedNotices(scope))
    .where('n.status', 'approved')
    .where('n.absence_end_date', '>=', TODAY)
    .orderBy('n.absence_start_date')
    .limit(LIST_LIMIT)
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

const recentActivity = (scope) =>
  withNames(scopedNotices(scope))
    .orderByRaw('COALESCE(n.approved_at, n.request_date) DESC')
    .limit(LIST_LIMIT)
    .select(
      'n.notice_id',
      'n.kind',
      'n.status',
      'e.employee_name',
      'r.description as reason_description',
      db.raw('COALESCE(n.approved_at, n.request_date) AS happened_at')
    );

const teamSummary = async (scope) => {
  const [activeEmployees, absentToday, pendingRequests, upcomingVacations, absences, departments, activity] =
    await Promise.all([
      count(forEmployees(db('employees'), scope, 'employee_id').where('status', 'active')),
      scopedNotices(scope)
        .where('n.status', 'approved')
        .where('n.absence_start_date', '<=', TODAY)
        .where('n.absence_end_date', '>=', TODAY)
        .countDistinct('n.employee_id as total')
        .first()
        .then((row) => Number(row.total)),
      count(scopedNotices(scope).where({ 'n.kind': 'request', 'n.status': 'pending' })),
      count(
        scopedNotices(scope)
          .join('reasons as r', 'r.reason_id', 'n.reason_id')
          .where('r.affects_vacation_balance', true)
          .where('n.status', 'approved')
          .whereBetween('n.absence_start_date', [TODAY, db.raw(`CURRENT_DATE + ${UPCOMING_DAYS}`)])
      ),
      upcomingAbsences(scope),
      departmentsWithEmployees(scope),
      recentActivity(scope),
    ]);

  return {
    active_employees: activeEmployees,
    absent_today: absentToday,
    pending_requests: pendingRequests,
    upcoming_vacations: upcomingVacations,
    upcoming_absences: absences,
    by_department: departments,
    recent_activity: activity,
  };
};

const findMyProfile = (employeeId) =>
  db('employees as e')
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

const mySummary = async (scope) => {
  if (!scope.employeeId) throw new AppError('EMPLOYEE_NOT_FOUND', 'Tu usuario no tiene un empleado vinculado');

  const own = { role: 'EMPLOYEE', branchIds: [], employeeId: scope.employeeId };
  const recent = { sort: '-request_date', page: 1, pageSize: MY_LIST_LIMIT };
  const [profile, balances, requests, registered] = await Promise.all([
    findMyProfile(scope.employeeId),
    entitlements.list({ status: 'active', page: 1, pageSize: 1, sort: '-period_start' }, own),
    notices.list({ ...recent, kind: 'request' }, own),
    notices.list({ ...recent, kind: 'notice' }, own),
  ]);

  return {
    profile,
    balance: balances.data[0] ?? null,
    requests: requests.data,
    notices: registered.data,
  };
};

module.exports = { teamSummary, mySummary };
