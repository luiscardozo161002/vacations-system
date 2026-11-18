const Boom = require('@hapi/boom');
const Joi = require('joi');
const CrudRoutes = require('../../lib/crud/crud-routes');
const { isoDate } = require('../../lib/list-query');
const service = require('./service');
const rollover = require('./rollover');
const schemas = require('./schemas');

class VacationEntitlementRoutes extends CrudRoutes {
  routes() {
    return [this.generateRoute(), ...super.routes()];
  }

  generateRoute() {
    return this.route({
      method: 'POST',
      path: `${this.path}/generate`,
      description: 'Open current periods, expire ended ones and send period reminders',
      permission: this.permissions.update,
      validate: { payload: Joi.object({ date: isoDate }).allow(null).unknown(false) },
      handler: (request) => {
        if (request.auth.credentials.role !== 'SUPERUSER') throw Boom.forbidden();
        return rollover.run(request.payload?.date);
      },
    });
  }
}

module.exports = new VacationEntitlementRoutes({
  name: 'vacation-entitlements',
  tag: 'vacation-entitlements',
  path: '/api/v1/vacation-entitlements',
  idParam: 'entitlementId',
  primaryKey: 'entitlement_id',
  label: { singular: 'vacation entitlement', plural: 'vacation entitlements' },
  permissions: {
    view: 'balances:view',
    create: 'balances:update',
    update: 'balances:update',
    delete: 'balances:update',
  },
  schemas,
  service,
}).plugin();
