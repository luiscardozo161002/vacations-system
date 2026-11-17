const CrudRoutes = require('../../lib/crud/crud-routes');
const service = require('./service');
const schemas = require('./schemas');

class NoticeRoutes extends CrudRoutes {
  routes() {
    return [
      this.listRoute(),
      this.getRoute(),
      this.pdfRoute(),
      this.previewRoute(),
      this.createRoute(),
      this.updateRoute(),
      this.resolveRoute('approve', 'Approve a pending request', this.permissions.review),
      this.resolveRoute('reject', 'Reject a pending request', this.permissions.review),
      this.resolveRoute('cancel', 'Cancel a request or notice', this.permissions.cancel),
    ];
  }

  pdfRoute() {
    return this.route({
      method: 'GET',
      path: `${this.itemPath()}/pdf`,
      description: 'Absence notice PDF in the RH format, only for approved notices',
      permission: this.permissions.view,
      validate: { params: this.schemas.params },
      handler: async (request, h) => {
        const file = await this.service.pdf(request.params.noticeId, this.scope(request));
        return h
          .response(file)
          .type('application/pdf')
          .header('Content-Disposition', `inline; filename="aviso-${request.params.noticeId}.pdf"`);
      },
    });
  }

  previewRoute() {
    return this.route({
      method: 'POST',
      path: `${this.path}/preview`,
      description: 'Preview the days, hours and balance a request would use',
      permission: this.permissions.create,
      validate: { payload: this.schemas.preview },
      handler: (request) => this.service.preview(request.payload, request.auth.credentials),
    });
  }

  createRoute() {
    return this.route({
      method: 'POST',
      description: this.describe('create'),
      permission: this.permissions.create,
      validate: { payload: this.schemas.create },
      handler: async (request, h) => {
        const notice = await this.service.create(request.payload, request.auth.credentials);
        return h.response(notice).code(201);
      },
    });
  }

  resolveRoute(action, description, permission) {
    return this.route({
      action,
      method: 'POST',
      path: `${this.itemPath()}/${action}`,
      description,
      permission,
      validate: { params: this.schemas.params },
      handler: (request) => this.service.resolve(request.params.noticeId, action, request.auth.credentials),
    });
  }
}

module.exports = new NoticeRoutes({
  name: 'notices',
  tag: 'notices',
  path: '/api/v1/notices',
  idParam: 'noticeId',
  primaryKey: 'notice_id',
  label: { singular: 'notice', plural: 'absence notices' },
  descriptions: { create: 'Create an absence notice' },
  permissions: {
    view: ['requests:view', 'notices:view'],
    create: ['requests:create', 'notices:create'],
    update: ['requests:update', 'notices:update'],
    review: 'approvals:review',
    cancel: ['approvals:review', 'requests:create'],
  },
  schemas,
  service,
  audit: {
    entity: 'notice',
    events: { approve: 'NOTICE_APPROVED', reject: 'NOTICE_REJECTED', cancel: 'NOTICE_CANCELLED' },
  },
}).plugin();
