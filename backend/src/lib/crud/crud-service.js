const { AppError } = require('../app-error');

class CrudService {
  constructor({ repository, editableFields, notFound }) {
    this.repository = repository;
    this.editableFields = editableFields;
    this.notFound = notFound;
  }

  pick(data, fields = this.editableFields) {
    const entries = fields.filter((field) => data[field] !== undefined).map((field) => [field, data[field]]);
    return Object.fromEntries(entries);
  }

  found(row) {
    if (!row) throw new AppError(this.notFound.code, this.notFound.message);
    return row;
  }

  list(filters, scope) {
    return this.repository.list(filters, scope);
  }

  async findById(id, scope) {
    return this.found(await this.repository.findById(id, scope));
  }

  create(data) {
    return this.repository.create(this.pick(data));
  }

  async update(id, data, scope) {
    return this.found(await this.repository.update(id, this.pick(data), scope));
  }

  async remove(id, scope) {
    return this.found(await this.repository.remove(id, scope));
  }
}

module.exports = CrudService;
