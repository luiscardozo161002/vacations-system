const { AppError } = require('../../lib/app-error');
const { computeRequestBreakdown, shiftDailyHours } = require('../../lib/request-breakdown');
const { EPSILON, toTotalHours, splitHours, describe } = require('../../lib/balance');
const { holidaysBetween } = require('../../lib/holidays');

class NoticeBalance {
  findEmployee(trx, employeeId) {
    return trx('employees')
      .where('employee_id', employeeId)
      .first('employee_id', 'shift_id', trx.raw("(start_date + INTERVAL '1 year')::date > CURRENT_DATE AS under_one_year"));
  }

  findSchedule(trx, shiftId) {
    return trx('shift_schedules')
      .where('shift_id', shiftId)
      .select('day_of_week', 'is_working_day', 'check_in_time', 'check_out_time');
  }

  findReason(trx, reasonId) {
    return trx('reasons').where('reason_id', reasonId).first('affects_vacation_balance');
  }

  findOpenEntitlement(trx, employeeId, lock) {
    const query = trx('vacation_entitlements')
      .where({ employee_id: employeeId, status: 'active' })
      .where('period_start', '<=', trx.raw('CURRENT_DATE'))
      .where('period_end', '>=', trx.raw('CURRENT_DATE'))
      .first();
    return lock ? query.forUpdate() : query;
  }

  hasInvalidRange(request) {
    if (request.absence_end_date < request.absence_start_date) return true;
    const sameDay = request.absence_end_date === request.absence_start_date;
    return sameDay && request.absence_start_time && request.absence_end_time
      ? request.absence_end_time <= request.absence_start_time
      : false;
  }

  problem(code, message) {
    return { code, message };
  }

  balanceProblem(employee, entitlement, request, requested, available, dailyHours) {
    if (employee.under_one_year) {
      return this.problem('NO_VACATION_YET', 'El empleado aún no cumple un año de antigüedad');
    }
    if (!entitlement) {
      return this.problem('NO_ACTIVE_PERIOD', 'El empleado no tiene un periodo de vacaciones vigente');
    }
    if (request.absence_start_date < entitlement.period_start || request.absence_end_date > entitlement.period_end) {
      return this.problem(
        'OUTSIDE_PERIOD',
        `Las fechas deben caer dentro del periodo vigente, del ${entitlement.period_start} al ${entitlement.period_end}`
      );
    }
    if (requested > available + EPSILON) {
      return this.problem(
        'INSUFFICIENT_BALANCE',
        `Excede el saldo disponible de ${describe(splitHours(available, dailyHours))}`
      );
    }
    return null;
  }

  async evaluate(trx, request, { lock = false } = {}) {
    const employee = await this.findEmployee(trx, request.employee_id);
    if (!employee) throw new AppError('INVALID_EMPLOYEE', 'El empleado no existe');

    const reason = await this.findReason(trx, request.reason_id);
    if (!reason) throw new AppError('INVALID_REASON', 'El motivo no existe');

    const schedule = await this.findSchedule(trx, employee.shift_id);
    const dailyHours = shiftDailyHours(schedule);

    if (this.hasInvalidRange(request)) {
      return {
        breakdown: null,
        affects_balance: reason.affects_vacation_balance,
        balance: null,
        error: this.problem('INVALID_RANGE', 'El final de la ausencia debe ser posterior al inicio'),
      };
    }

    const result = computeRequestBreakdown({
      schedule,
      startDate: request.absence_start_date,
      endDate: request.absence_end_date,
      startTime: request.absence_start_time,
      endTime: request.absence_end_time,
      holidays: holidaysBetween(request.absence_start_date, request.absence_end_date).map((holiday) => holiday.date),
    });
    const breakdown = {
      days: result.fullDays,
      hours: result.partialHours,
      rest_days: result.restDays,
      holidays: result.holidayDays,
      daily_hours: dailyHours,
    };
    const requested = toTotalHours(breakdown.days, breakdown.hours, dailyHours);

    if (requested <= 0) {
      return {
        breakdown,
        affects_balance: reason.affects_vacation_balance,
        balance: null,
        error: result.holidayDays
          ? this.problem(
              'MANDATORY_REST_DAY',
              'Ese día no se puede porque es descanso obligatorio por la Ley Federal del Trabajo'
            )
          : this.problem('NO_WORKING_DAYS', 'Las fechas elegidas caen en días de descanso del turno'),
      };
    }

    if (!reason.affects_vacation_balance) {
      return { breakdown, affects_balance: false, balance: null, error: null };
    }

    const entitlement = await this.findOpenEntitlement(trx, request.employee_id, lock);
    const total = entitlement ? entitlement.total_days * dailyHours : 0;
    const available = entitlement ? total - toTotalHours(entitlement.used_days, entitlement.used_hours, dailyHours) : 0;
    const error = this.balanceProblem(employee, entitlement, request, requested, available, dailyHours);

    return {
      breakdown,
      affects_balance: true,
      balance: entitlement
        ? {
            entitlement_id: entitlement.entitlement_id,
            period_start: entitlement.period_start,
            period_end: entitlement.period_end,
            total_days: entitlement.total_days,
            available: splitHours(available, dailyHours),
            remaining: splitHours(Math.max(0, available - requested), dailyHours),
          }
        : null,
      error,
      used: entitlement ? { entitlement, requested, dailyHours } : null,
    };
  }

  assertValid(evaluation) {
    if (evaluation.error) throw new AppError(evaluation.error.code, evaluation.error.message);
  }

  toResponse({ used: _used, ...evaluation }) {
    return evaluation;
  }

  async discount(trx, evaluation) {
    if (!evaluation.affects_balance) return null;

    const { entitlement, requested, dailyHours } = evaluation.used;
    const used = splitHours(
      toTotalHours(entitlement.used_days, entitlement.used_hours, dailyHours) + requested,
      dailyHours
    );
    await trx('vacation_entitlements')
      .where('entitlement_id', entitlement.entitlement_id)
      .update({ used_days: used.days, used_hours: used.hours });
    return entitlement.entitlement_id;
  }

  async refund(trx, notice) {
    if (!notice.entitlement_id) return;

    const entitlement = await trx('vacation_entitlements')
      .where('entitlement_id', notice.entitlement_id)
      .forUpdate()
      .first();
    const employee = await this.findEmployee(trx, notice.employee_id);
    const dailyHours = shiftDailyHours(await this.findSchedule(trx, employee.shift_id));
    const remainingUsed =
      toTotalHours(entitlement.used_days, entitlement.used_hours, dailyHours) -
      toTotalHours(notice.days_taken, notice.hours_taken, dailyHours);
    const used = splitHours(Math.max(0, remainingUsed), dailyHours);

    await trx('vacation_entitlements')
      .where('entitlement_id', entitlement.entitlement_id)
      .update({ used_days: used.days, used_hours: used.hours });
  }
}

module.exports = new NoticeBalance();
