const Hapi = require('@hapi/hapi');
const Boom = require('@hapi/boom');
const Jwt = require('@hapi/jwt');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const HapiSwagger = require('hapi-swagger');
const config = require('./config');
const pkg = require('../package.json');

require('./db');
const errorHandler = require('./lib/error-handler');
const healthPlugin = require('./plugins/health');
const employeesPlugin = require('./plugins/employees/routes');
const departmentsPlugin = require('./plugins/departments/routes');
const shiftsPlugin = require('./plugins/shifts/routes');
const companyPlugin = require('./plugins/company/routes');
const reasonsPlugin = require('./plugins/reasons/routes');
const rolesPlugin = require('./plugins/roles/routes');
const permissionsPlugin = require('./plugins/permissions/routes');
const rolePermissionsPlugin = require('./plugins/role-permissions/routes');
const vacationAccrualRulesPlugin = require('./plugins/vacation-accrual-rules/routes');
const vacationEntitlementsPlugin = require('./plugins/vacation-entitlements/routes');
const noticesPlugin = require('./plugins/notices/routes');
const usersPlugin = require('./plugins/users/routes');
const authAuditLogPlugin = require('./plugins/auth-audit-log/routes');
const authPlugin = require('./plugins/auth/routes');

const swaggerOptions = {
  info: {
    title: 'API Documentation System Vacation Management',
    version: pkg.version,
  },
  grouping: 'tags',
  securityDefinitions: {
    jwt: { type: 'apiKey', name: 'Authorization', in: 'header' },
  },
  security: [{ jwt: [] }],
};

const createServer = async () => {
  const server = Hapi.server({
    host: config.server.host,
    port: config.server.port,
    routes: {
      cors: {
        origin: config.cors.origins,
      },
      validate: {
        failAction: (_request, _h, err) => {
          throw Boom.badRequest(err.message);
        },
      },
    },
  });

  await server.register(Jwt);

  server.auth.strategy('jwt', 'jwt', {
    keys: config.auth.jwtSecret,
    verify: { aud: false, iss: false, sub: false, maxAgeSec: config.auth.accessTokenTtlSeconds },
    validate: (artifacts) => ({ isValid: true, credentials: artifacts.decoded.payload }),
  });
  server.auth.default('jwt');

  await server.register([
    Inert,
    Vision,
    { plugin: HapiSwagger, options: swaggerOptions },
    errorHandler,
    healthPlugin,
    employeesPlugin,
    departmentsPlugin,
    shiftsPlugin,
    companyPlugin,
    reasonsPlugin,
    rolesPlugin,
    permissionsPlugin,
    rolePermissionsPlugin,
    vacationAccrualRulesPlugin,
    vacationEntitlementsPlugin,
    noticesPlugin,
    usersPlugin,
    authAuditLogPlugin,
    authPlugin,
  ]);

  return server;
};

module.exports = createServer;
