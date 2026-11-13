const Hapi = require('@hapi/hapi');
const Boom = require('@hapi/boom');
const Jwt = require('@hapi/jwt');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const HapiSwagger = require('hapi-swagger');
const HapiPino = require('hapi-pino');
const config = require('./config');
const pkg = require('../package.json');

require('./db');
const errorHandler = require('./lib/error-handler');
const { auditPlugin } = require('./lib/audit');
const { VALIDATION_MESSAGES } = require('./lib/validation-messages');
const healthPlugin = require('./plugins/health');
const employeesPlugin = require('./plugins/employees/routes');
const departmentsPlugin = require('./plugins/departments/routes');
const shiftsPlugin = require('./plugins/shifts/routes');
const companyPlugin = require('./plugins/company/routes');
const branchesPlugin = require('./plugins/branches/routes');
const reasonsPlugin = require('./plugins/reasons/routes');
const rolesPlugin = require('./plugins/roles/routes');
const permissionsPlugin = require('./plugins/permissions/routes');
const rolePermissionsPlugin = require('./plugins/role-permissions/routes');
const vacationAccrualRulesPlugin = require('./plugins/vacation-accrual-rules/routes');
const vacationEntitlementsPlugin = require('./plugins/vacation-entitlements/routes');
const noticesPlugin = require('./plugins/notices/routes');
const calendarPlugin = require('./plugins/calendar/routes');
const dashboardPlugin = require('./plugins/dashboard/routes');
const notificationsPlugin = require('./plugins/notifications/routes');
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

const LOG_LEVELS = { production: 'info', test: 'silent' };

const loggerOptions = {
  level: LOG_LEVELS[config.env] ?? 'debug',
  redact: ['req.headers.authorization', 'req.headers.cookie'],
  ignorePaths: ['/api/v1/health'],
  ...(config.env === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: { singleLine: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname,req,res,responseTime' },
    },
  }),
};

const createServer = async () => {
  const server = Hapi.server({
    host: config.server.host,
    port: config.server.port,
    routes: {
      security: true,
      cors: {
        origin: config.cors.origins,
      },
      validate: {
        options: {
          messages: VALIDATION_MESSAGES,
          errors: { wrap: { label: false, array: false } },
        },
        failAction: (_request, _h, err) => {
          throw Boom.badRequest(err.message, { validation: true });
        },
      },
    },
  });

  await server.register({ plugin: HapiPino, options: loggerOptions });
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
    auditPlugin,
    errorHandler,
    healthPlugin,
    employeesPlugin,
    departmentsPlugin,
    shiftsPlugin,
    companyPlugin,
    branchesPlugin,
    reasonsPlugin,
    rolesPlugin,
    permissionsPlugin,
    rolePermissionsPlugin,
    vacationAccrualRulesPlugin,
    vacationEntitlementsPlugin,
    noticesPlugin,
    calendarPlugin,
    dashboardPlugin,
    notificationsPlugin,
    usersPlugin,
    authAuditLogPlugin,
    authPlugin,
  ]);

  return server;
};

module.exports = createServer;
