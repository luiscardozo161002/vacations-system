'use strict';

const db = require('../../db');
const { notify, shortDate } = require('../../lib/notify');

const TITLES = {
  request: {
    approved: 'Tu solicitud fue aprobada',
    rejected: 'Tu solicitud fue rechazada',
    cancelled: 'Tu solicitud fue cancelada',
  },
  notice: {
    approved: 'Recursos Humanos registró un aviso de ausencia',
    rejected: 'Tu aviso de ausencia fue rechazado',
    cancelled: 'Se canceló tu aviso de ausencia',
  },
};

const LINKS = { request: '/solicitudes', notice: '/avisos' };

const describeRange = ({ absence_start_date: start, absence_end_date: end }) =>
  start === end ? `el ${shortDate(start)}` : `del ${shortDate(start)} al ${shortDate(end)}`;

const notifyEmployee = async (notice, actorUserId) => {
  const user = await db('users').where('employee_id', notice.employee_id).first('user_id');
  if (!user || user.user_id === actorUserId) return;

  await notify({
    user_id: user.user_id,
    kind: `${notice.kind}_${notice.status}`,
    reference: String(notice.notice_id),
    title: TITLES[notice.kind][notice.status],
    body: `${notice.reason_description}, ${describeRange(notice)}.`,
    link: LINKS[notice.kind],
  });
};

module.exports = { notifyEmployee };
