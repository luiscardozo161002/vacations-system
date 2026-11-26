const CrudService = require('../../lib/crud/crud-service');
const repository = require('./repository');
const db = require('../../db');
const { AppError } = require('../../lib/app-error');
const { assertCanEdit } = require('../../lib/org-access');
const { EDITABLE_FIELDS } = require('./fields');

class BranchService extends CrudService {
  async assertCompanyIsActive(companyId) {
    const company = await db('company').where('company_id', companyId).first('status');
    if (!company) throw new AppError('INVALID_COMPANY', 'La empresa no existe');
    if (company.status !== 'active') throw new AppError('INVALID_COMPANY', 'La empresa está dada de baja');
  }

  async assertNoActiveDepartments(branchId) {
    const row = await db('departments').where({ branch_id: branchId, status: 'active' }).count('* as total').first();
    if (Number(row.total) > 0) {
      throw new AppError('BRANCH_HAS_DEPARTMENTS', 'Primero da de baja los departamentos activos de la sede');
    }
  }

  async create(data) {
    await this.assertCompanyIsActive(data.company_id);
    return super.create(data);
  }

  async update(id, data, scope) {
    assertCanEdit(data, scope);
    if (data.company_id !== undefined) {
      const current = await this.found(await this.repository.findById(id, scope));
      if (data.company_id !== current.company_id) {
        throw new AppError('INVALID_COMPANY', 'Una sede no puede cambiar de empresa');
      }
    }
    if (data.status === 'inactive') await this.assertNoActiveDepartments(id);
    if (data.status === 'active') {
      const branch = await this.repository.findById(id, scope);
      if (branch) await this.assertCompanyIsActive(data.company_id ?? branch.company_id);
    }
    return super.update(id, data, scope);
  }

  async remove(id, scope) {
    await this.assertNoActiveDepartments(id);
    return super.remove(id, scope);
  }

  async list(filters, scope) {
    const page = await super.list(filters, scope);
    return { ...page, data: await this.withEmployeeCounts(page.data) };
  }

  async findById(id, scope) {
    const [branch] = await this.withEmployeeCounts([await super.findById(id, scope)]);
    return branch;
  }

  async withEmployeeCounts(branches) {
    const counts = await db('employees as e')
      .join('departments as d', 'd.department_id', 'e.department_id')
      .whereIn('d.branch_id', branches.map((branch) => branch.branch_id))
      .where('e.status', 'active')
      .groupBy('d.branch_id')
      .select('d.branch_id', db.raw('COUNT(*)::int AS total'));
    const countOf = new Map(counts.map((row) => [row.branch_id, row.total]));
    const companies = await db('company')
      .whereIn('company_id', branches.map((branch) => branch.company_id))
      .select('company_id', 'folio', 'company_name', 'color');
    const companyOf = new Map(companies.map((company) => [company.company_id, company]));

    return branches.map((branch) => ({
      ...branch,
      active_employees: countOf.get(branch.branch_id) ?? 0,
      company_folio: companyOf.get(branch.company_id)?.folio ?? null,
      company_name: companyOf.get(branch.company_id)?.company_name ?? null,
      company_color: companyOf.get(branch.company_id)?.color ?? null,
    }));
  }
}

module.exports = new BranchService({
  repository,
  editableFields: EDITABLE_FIELDS,
  notFound: { code: 'BRANCH_NOT_FOUND', message: 'La sede no existe' },
});
