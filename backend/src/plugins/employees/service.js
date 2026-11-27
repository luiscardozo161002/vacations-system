const CrudService = require('../../lib/crud/crud-service');
const db = require('../../db');
const repository = require('./repository');
const access = require('./access');
const csv = require('../../lib/csv');
const { AppError } = require('../../lib/app-error');
const { EDITABLE_FIELDS } = require('./fields');

const EXPORT_HEADERS = [
  'Número',
  'Nombre',
  'Sede',
  'Departamento',
  'Turno',
  'Fecha de ingreso',
  'Fecha de nacimiento',
  'Correo',
  'Estado',
];
const STATUS_LABELS = { active: 'Activo', inactive: 'Inactivo' };

const toMexicanDate = (iso) => iso.split('-').reverse().join('/');

class EmployeeService extends CrudService {
  async exportCsv(filters, scope) {
    const rows = await this.repository.exportRows(filters, scope);
    return csv.write([
      EXPORT_HEADERS,
      ...rows.map((row) => [
        row.employee_number,
        row.employee_name,
        row.branch_code,
        row.department_name,
        row.shift_name,
        toMexicanDate(row.start_date),
        row.birth_date ? toMexicanDate(row.birth_date) : '',
        row.email,
        STATUS_LABELS[row.status],
      ]),
    ]);
  }

  async findById(id, scope) {
    const employee = await super.findById(id, scope);
    return { ...employee, account: (await access.findAccount(id)) ?? null };
  }

  async create(data, scope) {
    await this.checkReferences(data, scope);
    return db.transaction(async (trx) => {
      const employee = await this.repository.create(this.pick(data), trx);
      if (!data.email) return { ...employee, account: null };
      return { ...employee, ...(await access.grantAccess(employee.employee_id, data.email, trx)) };
    });
  }

  async update(id, data, scope) {
    await this.checkReferences(data, scope);
    const employee = await super.update(id, data, scope);
    if (data.status === 'active') await access.reopenAccount(id);
    if (data.status === 'inactive') await access.closeAccount(id);
    return employee;
  }

  async remove(id, scope) {
    const employee = await super.remove(id, scope);
    await access.closeAccount(id);
    return employee;
  }

  async resendAccess(id, email, scope) {
    await this.findById(id, scope);
    return db.transaction((trx) => access.grantAccess(id, email, trx));
  }

  async checkReferences(data, scope) {
    if (data.department_id !== undefined && !(await scope.allowsDepartment(data.department_id))) {
      throw new AppError('INVALID_DEPARTMENT', 'El departamento no existe');
    }
  }
}

module.exports = new EmployeeService({
  repository,
  editableFields: EDITABLE_FIELDS,
  notFound: { code: 'EMPLOYEE_NOT_FOUND', message: 'El empleado no existe' },
});
