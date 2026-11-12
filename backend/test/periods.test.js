const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { currentPeriod } = require('../src/lib/periods');

describe('currentPeriod', () => {
  it('antes del primer aniversario no hay periodo', () => {
    assert.equal(currentPeriod('2026-02-01', '2027-01-31'), null);
  });

  it('el periodo va de aniversario a aniversario', () => {
    assert.deepEqual(currentPeriod('2025-08-01', '2026-11-12'), {
      yearsOfService: 1,
      start: '2026-08-01',
      end: '2027-07-31',
      reminderFrom: '2027-07-25',
    });
  });

  it('el día del aniversario ya cuenta el año nuevo', () => {
    assert.equal(currentPeriod('2025-08-01', '2027-08-01').yearsOfService, 2);
    assert.equal(currentPeriod('2025-08-01', '2027-07-31').yearsOfService, 1);
  });

  it('un ingreso en 29 de febrero cumple el 1 de marzo en años no bisiestos', () => {
    assert.deepEqual(currentPeriod('2024-02-29', '2025-03-01'), {
      yearsOfService: 1,
      start: '2025-03-01',
      end: '2026-02-28',
      reminderFrom: '2026-02-22',
    });
  });
});
