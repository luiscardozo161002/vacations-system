const CrudRoutes = require('../../lib/crud/crud-routes');
const service = require('./service');
const schemas = require('./schemas');

class RolePermissionRoutes extends CrudRoutes {
  routes() {
    return [this.listRoute(), this.getRoute(), this.createRoute(), this.removeRoute()];
  }

  itemPath() {
    return `${this.path}/{roleId}/{permissionId}`;
  }

  getRoute() {
    return this.route({
      method: 'GET',
      path: this.itemPath(),
      description: this.describe('get'),
      permission: this.permissions.view,
      validate: { params: this.schemas.params },
      handler: (request) => this.service.findById(request.params.roleId, request.params.permissionId),
    });
  }

  removeRoute() {
    return this.route({
      action: 'remove',
      method: 'DELETE',
      path: this.itemPath(),
      description: this.describe('remove'),
      permission: this.permissions.delete,
      validate: { params: this.schemas.params },
      handler: async (request, h) => {
        await this.service.remove(request.params.roleId, request.params.permissionId);
        return h.response().code(204);
      },
    });
  }
}

module.exports = new RolePermissionRoutes({
  name: 'role-permissions',
  tag: 'role-permissions',
  path: '/api/v1/role-permissions',
  idParam: 'roleId',
  primaryKey: 'role_id',
  label: { singular: 'role-permission assignment', plural: 'role-permission assignments' },
  descriptions: {
    get: 'Check whether a permission is assigned to a role',
    create: 'Assign a permission to a role',
  },
  permissions: {
    view: 'permissions:view',
    create: 'permissions:update',
    delete: 'permissions:update',
  },
  schemas,
  service,
  audit: {
    entity: 'role',
    events: { create: 'PERMISSION_GRANTED', remove: 'PERMISSION_REVOKED' },
  },
}).plugin();
