const repository = require('./repository');
const { AppError } = require('../../lib/app-error');

class RolePermissionService {
  constructor(repository) {
    this.repository = repository;
  }

  found(rolePermission) {
    if (!rolePermission) throw new AppError('ROLE_PERMISSION_NOT_FOUND', 'Ese permiso no está asignado a ese rol');
    return rolePermission;
  }

  list(filters) {
    return this.repository.list(filters);
  }

  async findById(roleId, permissionId) {
    return this.found(await this.repository.findById(roleId, permissionId));
  }

  create(data) {
    return this.repository.create(data);
  }

  async remove(roleId, permissionId) {
    return this.found(await this.repository.remove(roleId, permissionId));
  }
}

module.exports = new RolePermissionService(repository);
