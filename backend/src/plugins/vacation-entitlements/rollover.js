const db = require('../../db');
const DataScope = require('../../lib/data-scope');
const { currentPeriod } = require('../../lib/periods');
const { describe: describeTime } = require('../../lib/balance');
const notifier = require('../../lib/notify');
const entitlements = require('./service');

const SYSTEM_SCOPE = new DataScope({ role: 'SUPERUSER', branchIds: [], employeeId: 0 });

class VacationRollover {
  constructor(entitlements) {
    this.entitlements = entitlements;
  }

  async today() {
    return (await db.first(db.raw("to_char(CURRENT_DATE, 'YYYY-MM-DD') AS today"))).today;
  }

  findRule(years, year) {
    return db('vacation_accrual_rules')
      .where('status', 'active')
      .where('years_from', '<=', years)
      .where((upper) => upper.whereNull('years_to').orWhere('years_to', '>=', years))
      .where('effective_year', '<=', year)
      .orderBy('effective_year', 'desc')
      .first('rule_id', 'vacation_days');
  }

  cancelOldPendingRequests(employeeId, periodStart) {
    return db('notices')
      .where({ employee_id: employeeId, kind: 'request', status: 'pending' })
      .whereIn('reason_id', db('reasons').where('affects_vacation_balance', true).select('reason_id'))
      .where('absence_start_date', '<', periodStart)
      .update({ status: 'cancelled' });
  }

  async openPeriod(employee, period) {
    const year = Number(period.start.slice(0, 4));
    const existing = await db('vacation_entitlements')
      .where('employee_id', employee.employee_id)
      .where((same) => same.where('period_start', period.start).orWhere('period_year', year))
      .first('entitlement_id');
    if (existing) return { entitlementId: existing.entitlement_id, created: false };

    const rule = await this.findRule(period.yearsOfService, year);
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
      await notifier.send({
        user_id: employee.user_id,
        kind: 'period_opened',
        reference: period.start,
        title: 'Se abrió tu nuevo periodo de vacaciones',
        body: `Del ${notifier.shortDate(period.start)} al ${notifier.shortDate(period.end)} tienes ${rule.vacation_days} días por ${period.yearsOfService} años de antigüedad.`,
        link: '/dias',
      });
    }
    return { entitlementId: row.entitlement_id, created: true };
  }

  async remindExpiration(employee, period, entitlementId, date) {
    if (!employee.user_id || date < period.reminderFrom) return false;

    const { available } = await this.entitlements.findById(entitlementId, SYSTEM_SCOPE);
    const inserted = await notifier.send({
      user_id: employee.user_id,
      kind: 'period_expiring',
      reference: period.end,
      title: 'Tus vacaciones están por vencer',
      body: `Te quedan ${describeTime(available)} y vencen el ${notifier.shortDate(period.end)}. Lo que no uses se pierde.`,
      link: '/solicitudes',
    });
    return inserted.length > 0;
  }

  findActiveEmployees() {
    return db('employees as e')
      .leftJoin('users as u', (join) => join.on('u.employee_id', 'e.employee_id').andOnVal('u.status', '<>', 'inactive'))
      .where('e.status', 'active')
      .orderBy('e.employee_id')
      .select('e.employee_id', 'e.employee_name', 'e.start_date', 'u.user_id');
  }

  async processEmployee(employee, day, summary) {
    const period = currentPeriod(employee.start_date, day);
    if (!period) return 'Aún no cumple un año de antigüedad';

    summary.cancelled_requests += await this.cancelOldPendingRequests(employee.employee_id, period.start);

    const opened = await this.openPeriod(employee, period);
    if (opened.skipped) return opened.skipped;

    if (opened.created) summary.created += 1;
    if (await this.remindExpiration(employee, period, opened.entitlementId, day)) summary.reminders += 1;
    return null;
  }

  async run(date) {
    const day = date ?? (await this.today());
    const summary = { date: day, created: 0, expired: 0, cancelled_requests: 0, reminders: 0, skipped: [] };

    summary.expired = await db('vacation_entitlements')
      .where('status', 'active')
      .where('period_end', '<', day)
      .update({ status: 'inactive' });

    for (const employee of await this.findActiveEmployees()) {
      let skipReason;
      try {
        skipReason = await this.processEmployee(employee, day, summary);
      } catch (err) {
        skipReason = `Error al procesar: ${err.message}`;
      }
      if (skipReason) summary.skipped.push({ employee_id: employee.employee_id, reason: skipReason });
    }

    return summary;
  }
}

module.exports = new VacationRollover(entitlements);
