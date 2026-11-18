const { requires } = require('./permissions');
const DataScope = require('./data-scope');

class ApiRoutes {
  constructor({ name, tag = name, service }) {
    this.name = name;
    this.tag = tag;
    this.service = service;
  }

  plugin() {
    return {
      name: `${this.name}-plugin`,
      version: '1.0.0',
      register: (server) => server.route(this.routes()),
    };
  }

  routes() {
    return [];
  }

  scope(request) {
    return DataScope.from(request.auth.credentials);
  }

  authOptions(permission) {
    if (permission === false) return { auth: false };
    if (permission === undefined) return {};
    return { auth: requires(...[permission].flat()) };
  }

  route({ method, path, description, notes, permission, validate, handler, plugins }) {
    return {
      method,
      path,
      options: {
        ...(plugins && { plugins }),
        description,
        ...(notes && { notes }),
        tags: ['api', this.tag],
        ...this.authOptions(permission),
        ...(validate && { validate }),
      },
      handler,
    };
  }
}

module.exports = ApiRoutes;
