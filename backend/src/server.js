const Hapi = require('@hapi/hapi');
const Boom = require('@hapi/boom');
const config = require('./config');

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
const shiftSchedulesPlugin = require('./plugins/shift-schedules/routes');
const vacationAccrualRulesPlugin = require('./plugins/vacation-accrual-rules/routes');
const vacationEntitlementsPlugin = require('./plugins/vacation-entitlements/routes');
const noticesPlugin = require('./plugins/notices/routes');
const usersPlugin = require('./plugins/users/routes');
const authAuditLogPlugin = require('./plugins/auth-audit-log/routes');
const authPlugin = require('./plugins/auth/routes');

const createServer = async () => {
  const server = Hapi.server({
    host: config.server.host,
    port: config.server.port,
    routes: {
      cors: {
        origin: ['*'],
      },
      validate: {
        failAction: (_request, _h, err) => {
          throw Boom.badRequest(err.message);
        },
      },
    },
  });

  await server.register([
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
    shiftSchedulesPlugin,
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
