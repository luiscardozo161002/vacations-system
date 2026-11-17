const CrudRepository = require('../../lib/crud/crud-repository');
const db = require('../../db');
const User = require('./model');
const { SAFE_COLUMNS } = require('./fields');
const { whereAnyOf } = require('../../lib/list-query');

const BRANCH_COLUMNS = ['b.branch_id', 'b.company_id', 'b.code', 'b.branch_name'];

class UserRepository extends CrudRepository {
  constructor() {
    super({ model: User, columns: SAFE_COLUMNS, primaryKey: 'user_id', hasUpdatedAt: true });
  }

  applyFilters(query, filters) {
    whereAnyOf(query, 'role_id', filters.role_id);
    if (filters.employee_id !== undefined) query.where('employee_id', filters.employee_id);
    return super.applyFilters(query, filters);
  }

  findBranches(userId) {
    return db('user_branches as ub')
      .join('branches as b', 'b.branch_id', 'ub.branch_id')
      .where('ub.user_id', userId)
      .orderBy('b.branch_id')
      .select(BRANCH_COLUMNS);
  }

  replaceBranches(userId, branchIds) {
    return db.transaction(async (trx) => {
      await trx('user_branches').where('user_id', userId).del();
      if (branchIds.length) {
        await trx('user_branches').insert(branchIds.map((branch_id) => ({ user_id: userId, branch_id })));
      }
    });
  }
}

module.exports = new UserRepository();
