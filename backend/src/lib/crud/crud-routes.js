const { requires } = require('../permissions');
const { scopeFrom } = require('../data-scope');

class CrudRoutes {
  constructor({ name, tag, path, idParam, primaryKey, label, descriptions = {}, permissions, schemas, service, audit }) {
    this.name = name;
    this.tag = tag;
    this.path = path;
    this.idParam = idParam;
    this.primaryKey = primaryKey;
    this.label = label;
    this.descriptions = descriptions;
    this.permissions = permissions;
    this.schemas = schemas;
    this.service = service;
    this.audit = audit;
  }

  plugin() {
    return {
      name: `${this.name}-plugin`,
      version: '1.0.0',
      register: (server) => server.route(this.routes()),
    };
  }

  routes() {
    return [this.listRoute(), this.getRoute(), this.createRoute(), this.updateRoute(), this.removeRoute()];
  }

  route({ method, path = this.path, description, permission, validate, handler, action }) {
    return {
      method,
      path,
      options: {
        ...this.auditOptions(action),
        description,
        tags: ['api', this.tag],
        auth: requires(permission),
        validate,
      },
      handler,
    };
  }

  auditOptions(action) {
    const event = this.audit?.events[action];
    if (!event) return {};
    const id = action === 'create' ? this.primaryKey : this.idParam;
    return { plugins: { audit: { event, entity: this.audit.entity, id } } };
  }

  describe(action) {
    const defaults = {
      list: `List ${this.label.plural}`,
      get: `Get a ${this.label.singular} by ID`,
      create: `Create a ${this.label.singular}`,
      update: `Update a ${this.label.singular}`,
      remove: `Deactivate a ${this.label.singular}`,
    };
    return this.descriptions[action] ?? defaults[action];
  }

  itemPath() {
    return `${this.path}/{${this.idParam}}`;
  }

  scope(request) {
    return scopeFrom(request.auth.credentials);
  }

  listRoute() {
    return this.route({
      method: 'GET',
      description: this.describe('list'),
      permission: this.permissions.view,
      validate: { query: this.schemas.list },
      handler: (request) => this.service.list(request.query, this.scope(request)),
    });
  }

  getRoute() {
    return this.route({
      method: 'GET',
      path: this.itemPath(),
      description: this.describe('get'),
      permission: this.permissions.view,
      validate: { params: this.schemas.params },
      handler: (request) => this.service.findById(request.params[this.idParam], this.scope(request)),
    });
  }

  createRoute() {
    return this.route({
      action: 'create',
      method: 'POST',
      description: this.describe('create'),
      permission: this.permissions.create,
      validate: { payload: this.schemas.create },
      handler: async (request, h) => {
        const created = await this.service.create(request.payload, this.scope(request));
        return h.response(created).code(201);
      },
    });
  }

  updateRoute() {
    return this.route({
      action: 'update',
      method: 'PATCH',
      path: this.itemPath(),
      description: this.describe('update'),
      permission: this.permissions.update,
      validate: { params: this.schemas.params, payload: this.schemas.update },
      handler: (request) => this.service.update(request.params[this.idParam], request.payload, this.scope(request)),
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
        await this.service.remove(request.params[this.idParam], this.scope(request));
        return h.response().code(204);
      },
    });
  }
}

module.exports = CrudRoutes;
