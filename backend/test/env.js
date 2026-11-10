process.env.NODE_ENV = 'test';
process.env.DB_NAME = process.env.TEST_DB_NAME || 'vacations_test';

if (!process.env.DB_NAME.endsWith('_test')) {
  throw new Error(`La base de pruebas debe terminar en _test (se recibio "${process.env.DB_NAME}")`);
}
