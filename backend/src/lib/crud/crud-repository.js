const db = require('../../db');
const { buildOrderBy, paginationMeta, whereAnyOf } = require('../list-query');

class CrudRepository {
  constructor({ model, columns, primaryKey, hasUpdatedAt = false }) {
    this.model = model;
    this.columns = columns;
    this.primaryKey = primaryKey;
    this.hasUpdatedAt = hasUpdatedAt;
    this.defaultSort = [{ column: primaryKey, order: 'asc' }];
  }

  baseQuery() {
    return this.model.query().select(this.columns);
  }

  restrictToScope(query) {
    return query;
  }

  applyFilters(query, filters) {
    return whereAnyOf(query, 'status', filters.status);
  }

  async list({ sort, page = 1, pageSize = 20, ...filters } = {}, scope) {
    const query = this.baseQuery().orderBy(buildOrderBy(sort, this.columns, this.defaultSort));
    this.restrictToScope(query, scope);
    this.applyFilters(query, filters);

    const { results, total } = await query.page(page - 1, pageSize);
    return { data: results, pagination: paginationMeta(page, pageSize, total) };
  }

  findById(id, scope) {
    return this.restrictToScope(this.baseQuery().where(this.primaryKey, id), scope).first();
  }

  create(data) {
    return this.model.query().insert(data).returning(this.columns);
  }

  update(id, data, scope) {
    return this.patch(id, data, scope);
  }

  remove(id, scope) {
    return this.patch(id, { status: 'inactive' }, scope);
  }

  async patch(id, data, scope) {
    const changes = this.hasUpdatedAt ? { ...data, updated_at: db.fn.now() } : data;
    const query = this.restrictToScope(this.model.query().where(this.primaryKey, id), scope);
    const [row] = await query.patch(changes).returning(this.columns);
    return row ?? null;
  }
}

module.exports = CrudRepository;
