'use strict';

const ID_COLUMN = 'log_id';

const COLUMNS = [ID_COLUMN, 'user_id', 'event_type', 'ip_address', 'user_agent', 'metadata', 'created_at'];

module.exports = { ID_COLUMN, COLUMNS };
