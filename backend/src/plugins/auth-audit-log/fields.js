'use strict';

const ID_COLUMN = 'log_id';

const COLUMNS = [
  ID_COLUMN,
  'user_id',
  'event_type',
  'result',
  'entity',
  'entity_id',
  'ip_address',
  'user_agent',
  'request_id',
  'metadata',
  'created_at',
];

module.exports = { ID_COLUMN, COLUMNS };
