const { resetSequence } = require('../seed-helpers');

const ACCRUAL_RULES_LFT_ART_76 = [
  { rule_id: 1, years_from: 1, years_to: 1, vacation_days: 12, effective_year: 2023, status: 'active' },
  { rule_id: 2, years_from: 2, years_to: 2, vacation_days: 14, effective_year: 2023, status: 'active' },
  { rule_id: 3, years_from: 3, years_to: 3, vacation_days: 16, effective_year: 2023, status: 'active' },
  { rule_id: 4, years_from: 4, years_to: 4, vacation_days: 18, effective_year: 2023, status: 'active' },
  { rule_id: 5, years_from: 5, years_to: 5, vacation_days: 20, effective_year: 2023, status: 'active' },
  { rule_id: 6, years_from: 6, years_to: 10, vacation_days: 22, effective_year: 2023, status: 'active' },
  { rule_id: 7, years_from: 11, years_to: 15, vacation_days: 24, effective_year: 2023, status: 'active' },
  { rule_id: 8, years_from: 16, years_to: 20, vacation_days: 26, effective_year: 2023, status: 'active' },
  { rule_id: 9, years_from: 21, years_to: 25, vacation_days: 28, effective_year: 2023, status: 'active' },
  { rule_id: 10, years_from: 26, years_to: 30, vacation_days: 30, effective_year: 2023, status: 'active' },
  { rule_id: 11, years_from: 31, years_to: 35, vacation_days: 32, effective_year: 2023, status: 'active' },
];

const INSERT_CURRENT_PERIOD_ENTITLEMENTS = `
  INSERT INTO vacation_entitlements
      (employee_id, period_year, years_of_service, rule_id, total_days, used_days, period_start, period_end)
  SELECT
      e.employee_id,
      EXTRACT(YEAR FROM CURRENT_DATE)::int,
      EXTRACT(YEAR FROM age(CURRENT_DATE, e.start_date))::int AS years_of_service,
      r.rule_id,
      r.vacation_days,
      0,
      (e.start_date + make_interval(years => EXTRACT(YEAR FROM age(CURRENT_DATE, e.start_date))::int))::date,
      (e.start_date + make_interval(years => EXTRACT(YEAR FROM age(CURRENT_DATE, e.start_date))::int + 1) - INTERVAL '1 day')::date
  FROM employees e
  JOIN vacation_accrual_rules r
      ON EXTRACT(YEAR FROM age(CURRENT_DATE, e.start_date))::int BETWEEN r.years_from AND COALESCE(r.years_to, 999)
     AND r.status = 'active'
     AND r.effective_year = (SELECT MAX(effective_year) FROM vacation_accrual_rules WHERE effective_year <= EXTRACT(YEAR FROM CURRENT_DATE)::int)
`;

exports.seed = async function (knex) {
  await knex('vacation_accrual_rules').insert(ACCRUAL_RULES_LFT_ART_76);
  await resetSequence(knex, 'vacation_accrual_rules', 'rule_id');

  await knex.raw(INSERT_CURRENT_PERIOD_ENTITLEMENTS);
};
