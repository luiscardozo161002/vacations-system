const CrudService = require('../../lib/crud/crud-service');
const repository = require('./repository');
const db = require('../../db');
const { AppError } = require('../../lib/app-error');
const { EDITABLE_FIELDS } = require('./fields');

const NO_UPPER_LIMIT = 999;

class VacationAccrualRuleService extends CrudService {
  async create(data) {
    const rule = this.pick(data);
    await this.checkRange({ status: 'active', ...rule });
    return this.repository.create(rule);
  }

  async update(id, data, scope) {
    const current = await this.findById(id);
    await this.checkRange({ ...current, ...this.pick(data) }, id);
    return super.update(id, data, scope);
  }

  async checkRange(rule, ruleId = 0) {
    if (rule.status === 'inactive') return;
    if (rule.years_to != null && rule.years_to < rule.years_from) {
      throw new AppError('INVALID_RULE_RANGE', 'La antigüedad "hasta" no puede ser menor que "desde"');
    }

    const overlapping = await db('vacation_accrual_rules')
      .where({ effective_year: rule.effective_year, status: 'active' })
      .whereNot('rule_id', ruleId)
      .where('years_from', '<=', rule.years_to ?? NO_UPPER_LIMIT)
      .where((upper) => upper.whereNull('years_to').orWhere('years_to', '>=', rule.years_from))
      .first('years_from', 'years_to');

    if (overlapping) {
      throw new AppError(
        'RULE_OVERLAP',
        `Se cruza con la regla de ${overlapping.years_from} a ${overlapping.years_to ?? 'más'} años`
      );
    }
  }
}

module.exports = new VacationAccrualRuleService({
  repository,
  editableFields: EDITABLE_FIELDS,
  notFound: { code: 'VACATION_RULE_NOT_FOUND', message: 'La regla de acumulación no existe' },
});
