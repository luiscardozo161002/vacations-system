const CrudRoutes = require('../../lib/crud/crud-routes');
const service = require('./service');
const schemas = require('./schemas');

class UserRoutes extends CrudRoutes {
  routes() {
    return [...super.routes(), this.listBranchesRoute(), this.replaceBranchesRoute()];
  }

  listBranchesRoute() {
    return this.route({
      method: 'GET',
      path: `${this.itemPath()}/branches`,
      description: 'List the branches assigned to a user',
      permission: this.permissions.view,
      validate: { params: this.schemas.params },
      handler: (request) => this.service.findBranches(request.params.userId),
    });
  }

  replaceBranchesRoute() {
    return this.route({
      action: 'branches',
      method: 'PUT',
      path: `${this.itemPath()}/branches`,
      description: 'Replace the branches assigned to a user',
      permission: this.permissions.update,
      validate: { params: this.schemas.params, payload: this.schemas.branches },
      handler: (request) => this.service.replaceBranches(request.params.userId, request.payload.branch_ids),
    });
  }
}

module.exports = new UserRoutes({
  name: 'users',
  tag: 'users',
  path: '/api/v1/users',
  idParam: 'userId',
  primaryKey: 'user_id',
  label: { singular: 'user', plural: 'users' },
  descriptions: {
    list: 'List users (never returns password_hash)',
    get: 'Get a user by ID (never returns password_hash)',
    create: 'Create a user (password is hashed before storing)',
    update: 'Update a user (password is re-hashed if sent)',
  },
  permissions: { view: 'users:view', create: 'users:create', update: 'users:update', delete: 'users:delete' },
  schemas,
  service,
  audit: {
    entity: 'user',
    events: {
      create: 'USER_CREATED',
      update: 'USER_UPDATED',
      remove: 'USER_DEACTIVATED',
      branches: 'USER_BRANCHES_CHANGED',
    },
  },
}).plugin();
