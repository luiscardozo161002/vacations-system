const CrudService = require('../../lib/crud/crud-service');
const repository = require('./repository');
const db = require('../../db');
const { AppError } = require('../../lib/app-error');
const { EDITABLE_FIELDS } = require('./fields');

const byKey = (rows, key) => new Map(rows.map((row) => [row[key], row]));

class DepartmentService extends CrudService {
  async list(filters, scope) {
    const page = await super.list(filters, scope);
    return { ...page, data: await this.describeAll(page.data) };
  }

  async findById(id, scope) {
    return this.describe(await super.findById(id, scope));
  }

  async create(data, scope) {
    await this.checkReferences(data, scope);
    return this.describe(await super.create(data, scope));
  }

  async update(id, data, scope) {
    await this.checkReferences(data, scope);
    return this.describe(await super.update(id, data, scope));
  }

  async checkReferences(data, scope) {
    if (data.branch_id !== undefined && !(await scope.allowsBranch(data.branch_id))) {
      throw new AppError('INVALID_BRANCH', 'La sede no existe');
    }
    if (data.manager_employee_id != null && !(await scope.allowsEmployee(data.manager_employee_id))) {
      throw new AppError('INVALID_MANAGER', 'El empleado asignado como responsable no existe');
    }
  }

  async describe(department) {
    return (await this.describeAll([department]))[0];
  }

  async describeAll(departments) {
    const [counts, managers, branches] = await Promise.all([
      db('employees')
        .whereIn('department_id', departments.map((department) => department.department_id))
        .where('status', 'active')
        .groupBy('department_id')
        .select('department_id', db.raw('COUNT(*)::int AS total')),
      db('employees')
        .whereIn('employee_id', departments.map((department) => department.manager_employee_id).filter(Boolean))
        .select('employee_id', 'employee_name'),
      db('branches as b')
        .join('company as c', 'c.company_id', 'b.company_id')
        .whereIn('b.branch_id', departments.map((department) => department.branch_id))
        .select(
          'b.branch_id',
          'b.code',
          'b.branch_name',
          'b.color as branch_color',
          'c.company_id',
          'c.folio as company_folio',
          'c.company_name',
          'c.color as company_color'
        ),
    ]);
    const countOf = byKey(counts, 'department_id');
    const managerOf = byKey(managers, 'employee_id');
    const branchOf = byKey(branches, 'branch_id');

    return departments.map((department) => {
      const branch = branchOf.get(department.branch_id);
      return {
        ...department,
        manager_name: managerOf.get(department.manager_employee_id)?.employee_name ?? null,
        active_employees: countOf.get(department.department_id)?.total ?? 0,
        branch_code: branch?.code ?? null,
        branch_name: branch?.branch_name ?? null,
        branch_color: branch?.branch_color ?? null,
        company_id: branch?.company_id ?? null,
        company_folio: branch?.company_folio ?? null,
        company_name: branch?.company_name ?? null,
        company_color: branch?.company_color ?? null,
      };
    });
  }
}

module.exports = new DepartmentService({
  repository,
  editableFields: EDITABLE_FIELDS,
  notFound: { code: 'DEPARTMENT_NOT_FOUND', message: 'El departamento no existe' },
});
