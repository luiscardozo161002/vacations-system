'use strict';

const db = require('../../db');
const { currentPeriod } = require('../../lib/periods');
const { describe: describeTime } = require('../../lib/balance');
const { notify } = require('../notifications/service');
const entitlements = require('./service');

const SYSTEM_SCOPE = { role: 'SUPERUSER', branchIds: [], employeeId: 0 };

const shortDate = (iso) => iso.split('-').reverse().join('/');

const today = async () => (await db.first(db.raw("to_char(CURRENT_DATE, 'YYYY-MM-DD') AS today"))).today;

const findRule = (years, year) =>
  db('vacation_accrual_rules')
    .where('status', 'active')
    .where('years_from', '<=', years)
    .where((upper) => upper.whereNull('years_to').orWhere('years_to', '>=', years))
    .where('effective_year', '<=', year)
    .orderBy('effective_year', 'desc')
    .first('rule_id', 'vacation_days');

const cancelOldPendingRequests = (employeeId, periodStart) =>
  db('notices')
    .where({ employee_id: employeeId, kind: 'request', status: 'pending' })
    .whereIn('reason_id', db('reasons').where('affects_vacation_balance', true).select('reason_id'))
    .where('absence_start_date', '<', periodStart)
    .update({ status: 'cancelled' });

const openPeriod = async (employee, period) => {
  const year = Number(period.start.slice(0, 4));
  const existing = await db('vacation_entitlements')
    .where('employee_id', employee.employee_id)
    .where((same) => same.where('period_start', period.start).orWhere('period_year', year))
    .first('entitlement_id');
  if (existing) return { entitlementId: existing.entitlement_id, created: false };

  const rule = await findRule(period.yearsOfService, year);
  if (!rule) return { skipped: `No hay regla para ${period.yearsOfService} años de antigüedad` };

  const [row] = await db('vacation_entitlements')
    .insert({
      employee_id: employee.employee_id,
      period_year: year,
      years_of_service: period.yearsOfService,
      rule_id: rule.rule_id,
      total_days: rule.vacation_days,
      used_days: 0,
      used_hours: 0,
      period_start: period.start,
      period_end: period.end,
    })
    .returning('entitlement_id');

  if (employee.user_id) {
    await notify({
      user_id: employee.user_id,
      kind: 'period_opened',
      reference: period.start,
      title: 'Se abrió tu nuevo periodo de vacaciones',
      body: `Del ${shortDate(period.start)} al ${shortDate(period.end)} tienes ${rule.vacation_days} días por ${period.yearsOfService} años de antigüedad.`,
      link: '/dias',
    });
  }
  return { entitlementId: row.entitlement_id, created: true };
};

const remindExpiration = async (employee, period, entitlementId, date) => {
  if (!employee.user_id || date < period.reminderFrom) return false;

  const { available } = await entitlements.findById(entitlementId, SYSTEM_SCOPE);
  const inserted = await notify({
    user_id: employee.user_id,
    kind: 'period_expiring',
    reference: period.end,
    title: 'Tus vacaciones están por vencer',
    body: `Te quedan ${describeTime(available)} y vencen el ${shortDate(period.end)}. Lo que no uses se pierde.`,
    link: '/solicitudes',
  });
  return inserted.length > 0;
};

const rollover = async (date) => {
  const day = date ?? (await today());
  const summary = { date: day, created: 0, expired: 0, cancelled_requests: 0, reminders: 0, skipped: [] };

  summary.expired = await db('vacation_entitlements')
    .where('status', 'active')
    .where('period_end', '<', day)
    .update({ status: 'inactive' });

  const employees = await db('employees as e')
    .leftJoin('users as u', (join) => join.on('u.employee_id', 'e.employee_id').andOnVal('u.status', '<>', 'inactive'))
    .where('e.status', 'active')
    .orderBy('e.employee_id')
    .select('e.employee_id', 'e.employee_name', 'e.start_date', 'u.user_id');

  const skip = (employee, reason) => summary.skipped.push({ employee_id: employee.employee_id, reason });

  for (const employee of employees) {
    const period = currentPeriod(employee.start_date, day);
    if (!period) {
      skip(employee, 'Aún no cumple un año de antigüedad');
      continue;
    }

    try {
      summary.cancelled_requests += await cancelOldPendingRequests(employee.employee_id, period.start);

      const opened = await openPeriod(employee, period);
      if (opened.skipped) {
        skip(employee, opened.skipped);
        continue;
      }
      if (opened.created) summary.created += 1;
      if (await remindExpiration(employee, period, opened.entitlementId, day)) summary.reminders += 1;
    } catch (err) {
      skip(employee, `Error al procesar: ${err.message}`);
    }
  }

  return summary;
};

module.exports = { rollover };
