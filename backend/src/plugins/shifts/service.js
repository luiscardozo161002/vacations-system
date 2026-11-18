const CrudService = require('../../lib/crud/crud-service');
const repository = require('./repository');
const db = require('../../db');
const { AppError } = require('../../lib/app-error');
const { EDITABLE_FIELDS } = require('./fields');

class ShiftService extends CrudService {
  async list(filters, scope) {
    const page = await super.list(filters);
    return { ...page, data: await this.withEmployeeCounts(page.data, scope) };
  }

  async create(data) {
    const shift = await super.create(data);
    return this.findById(shift.shift_id);
  }

  async update(id, data) {
    await super.update(id, data);
    return this.findById(id);
  }

  async replaceSchedule(id, days) {
    await this.findById(id);

    const invalidDay = days.find((day) => day.is_working_day && day.check_out_time <= day.check_in_time);
    if (invalidDay) {
      throw new AppError('INVALID_SCHEDULE', `La salida debe ser después de la entrada (día ${invalidDay.day_of_week})`);
    }

    await this.repository.replaceSchedule(id, days);
    return this.findById(id);
  }

  async withEmployeeCounts(shifts, scope) {
    const counts = await scope
      .restrictEmployees(db('employees'), 'employee_id')
      .whereIn('shift_id', shifts.map((shift) => shift.shift_id))
      .where('status', 'active')
      .groupBy('shift_id')
      .select('shift_id', db.raw('COUNT(*)::int AS total'));
    const countOf = new Map(counts.map((row) => [row.shift_id, row.total]));

    return shifts.map((shift) => ({ ...shift, active_employees: countOf.get(shift.shift_id) ?? 0 }));
  }
}

module.exports = new ShiftService({
  repository,
  editableFields: EDITABLE_FIELDS,
  notFound: { code: 'SHIFT_NOT_FOUND', message: 'El turno no existe' },
});
