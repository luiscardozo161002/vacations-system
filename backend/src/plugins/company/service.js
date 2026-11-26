const CrudService = require('../../lib/crud/crud-service');
const db = require('../../db');
const { AppError } = require('../../lib/app-error');
const { assertCanEdit } = require('../../lib/org-access');
const repository = require('./repository');
const { EDITABLE_FIELDS } = require('./fields');

const OPTIONAL_TEXT = ['logo', 'location', 'phone_number', 'rfc'];

const blankToNull = (data) =>
  Object.fromEntries(Object.entries(data).map(([field, value]) => [field, OPTIONAL_TEXT.includes(field) && value === '' ? null : value]));

class CompanyService extends CrudService {
  create(data) {
    return super.create(blankToNull(data));
  }

  async assertNoActiveBranches(companyId) {
    const row = await db('branches').where({ company_id: companyId, status: 'active' }).count('* as total').first();
    if (Number(row.total) > 0) {
      throw new AppError('COMPANY_HAS_BRANCHES', 'Primero da de baja las sedes activas de la empresa');
    }
  }

  async update(id, data, scope) {
    assertCanEdit(data, scope);
    if (data.status === 'inactive') await this.assertNoActiveBranches(id);
    return super.update(id, blankToNull(data), scope);
  }

  async remove(id, scope) {
    await this.assertNoActiveBranches(id);
    return super.remove(id, scope);
  }
}

module.exports = new CompanyService({
  repository,
  editableFields: EDITABLE_FIELDS,
  notFound: { code: 'COMPANY_NOT_FOUND', message: 'La empresa no existe' },
});
