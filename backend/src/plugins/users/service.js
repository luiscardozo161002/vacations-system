const CrudService = require('../../lib/crud/crud-service');
const repository = require('./repository');
const db = require('../../db');
const password = require('../../lib/password');
const { AppError } = require('../../lib/app-error');
const { EDITABLE_FIELDS } = require('./fields');

class UserService extends CrudService {
  async list(filters, scope) {
    const page = await super.list(filters, scope);
    return { ...page, data: await this.describeAll(page.data) };
  }

  async findById(id, scope) {
    return this.describe(await super.findById(id, scope));
  }

  async create(data) {
    const role = await db('roles').where('role_id', data.role_id).first('role_code');
    if (role?.role_code === 'EMPLOYEE') {
      throw new AppError('EMPLOYEE_ACCOUNT_FROM_EMPLOYEE', 'Las cuentas de empleado se crean desde el perfil del empleado');
    }
    const user = await this.repository.create({ ...this.pick(data), password_hash: await password.hash(data.password) });
    return this.describe(user);
  }

  async update(id, data, scope) {
    const changes = this.pick(data);
    if (data.password !== undefined) changes.password_hash = await password.hash(data.password);
    return this.describe(this.found(await this.repository.update(id, changes, scope)));
  }

  async findBranches(id, scope) {
    await super.findById(id, scope);
    return this.repository.findBranches(id);
  }

  async replaceBranches(id, branchIds, scope) {
    await super.findById(id, scope);
    await this.repository.replaceBranches(id, [...new Set(branchIds)]);
    return this.repository.findBranches(id);
  }

  async describe(user) {
    return (await this.describeAll([user]))[0];
  }

  async describeAll(users) {
    const [roles, employees, branches] = await Promise.all([
      db('roles').whereIn('role_id', users.map((user) => user.role_id)).select('role_id', 'role_code'),
      db('employees')
        .whereIn('employee_id', users.map((user) => user.employee_id).filter(Boolean))
        .select('employee_id', 'employee_name'),
      db('user_branches as ub')
        .join('branches as b', 'b.branch_id', 'ub.branch_id')
        .whereIn('ub.user_id', users.map((user) => user.user_id))
        .orderBy('b.branch_id')
        .select('ub.user_id', 'b.code'),
    ]);
    const roleOf = new Map(roles.map((role) => [role.role_id, role.role_code]));
    const employeeOf = new Map(employees.map((employee) => [employee.employee_id, employee.employee_name]));

    return users.map((user) => ({
      ...user,
      role_code: roleOf.get(user.role_id) ?? null,
      employee_name: employeeOf.get(user.employee_id) ?? null,
      branch_codes: branches.filter((branch) => branch.user_id === user.user_id).map((branch) => branch.code),
    }));
  }
}

module.exports = new UserService({
  repository,
  editableFields: EDITABLE_FIELDS,
  notFound: { code: 'USER_NOT_FOUND', message: 'El usuario no existe' },
});
