const CrudRepository = require('../../lib/crud/crud-repository');
const Shift = require('./model');
const ShiftSchedule = require('./schedule-model');
const { COLUMNS } = require('./fields');

class ShiftRepository extends CrudRepository {
  constructor() {
    super({ model: Shift, columns: COLUMNS, primaryKey: 'shift_id', hasUpdatedAt: true, hidesInactive: true });
  }

  baseQuery() {
    return super.baseQuery().withGraphFetched('schedule(week)');
  }

  replaceSchedule(shiftId, days) {
    return ShiftSchedule.query()
      .insert(days.map((day) => ({ ...day, shift_id: shiftId, status: 'active' })))
      .onConflict(['shift_id', 'day_of_week'])
      .merge(['is_working_day', 'check_in_time', 'check_out_time', 'status']);
  }
}

module.exports = new ShiftRepository();
