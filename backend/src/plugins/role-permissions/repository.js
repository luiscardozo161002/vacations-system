const CrudRepository = require('../../lib/crud/crud-repository');
const RolePermission = require('./model');
const { COLUMNS } = require('./fields');

class RolePermissionRepository extends CrudRepository {
  constructor() {
    super({ model: RolePermission, columns: COLUMNS, primaryKey: 'role_id' });
    this.defaultSort = [
      { column: 'role_id', order: 'asc' },
      { column: 'permission_id', order: 'asc' },
    ];
  }

  applyFilters(query, filters) {
    if (filters.role_id !== undefined) query.where('role_id', filters.role_id);
    if (filters.permission_id !== undefined) query.where('permission_id', filters.permission_id);
    return super.applyFilters(query, filters);
  }

  findById(roleId, permissionId) {
    return this.baseQuery().findById([roleId, permissionId]);
  }

  create(data) {
    return this.model
      .query()
      .insert({ ...data, status: 'active' })
      .onConflict(['role_id', 'permission_id'])
      .merge({ status: 'active' })
      .returning(this.columns);
  }

  async remove(roleId, permissionId) {
    const [rolePermission] = await this.model
      .query()
      .where({ role_id: roleId, permission_id: permissionId })
      .patch({ status: 'inactive' })
      .returning(this.columns);
    return rolePermission ?? null;
  }
}

module.exports = new RolePermissionRepository();
