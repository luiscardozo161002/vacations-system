'use strict';

const ID_COLUMN = 'log_id';

// Sin EDITABLE_FIELDS a proposito: este log es de solo lectura por la API (lo escriben
// unicamente los flujos de backend/plugins/auth, nunca un cliente).
const COLUMNS = [ID_COLUMN, 'user_id', 'event_type', 'ip_address', 'user_agent', 'metadata', 'created_at'];

module.exports = { ID_COLUMN, COLUMNS };
