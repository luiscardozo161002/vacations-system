const db = require('../../db');

const COLUMNS = ['theme', 'backdrop_light', 'backdrop_dark', 'button_color', 'window_alpha'];
const EMPTY = Object.fromEntries(COLUMNS.map((column) => [column, null]));

class UserSettingsService {
  async get(userId) {
    const row = await db('user_settings').where('user_id', userId).first(COLUMNS);
    if (!row) return EMPTY;
    return { ...row, window_alpha: row.window_alpha === null ? null : Number(row.window_alpha) };
  }

  async save(userId, data) {
    await db('user_settings')
      .insert({ user_id: userId, ...data })
      .onConflict('user_id')
      .merge({ ...data, updated_at: db.fn.now() });
    return this.get(userId);
  }
}

module.exports = new UserSettingsService();
