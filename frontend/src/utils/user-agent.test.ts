import { describe, expect, it } from 'vitest';
import { describeDevice } from './user-agent';

const CHROME_WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const EDGE_WINDOWS = `${CHROME_WINDOWS} Edg/124.0`;
const SAFARI_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile Safari/604.1';

describe('describeDevice', () => {
  it('reconoce el navegador y el sistema', () => {
    expect(describeDevice(CHROME_WINDOWS)).toBe('Chrome en Windows');
    expect(describeDevice(SAFARI_IPHONE)).toBe('Safari en iOS');
  });

  it('Edge se reconoce antes que Chrome, porque su texto incluye ambos', () => {
    expect(describeDevice(EDGE_WINDOWS)).toBe('Edge en Windows');
  });

  it('devuelve el texto original si no lo reconoce y nada si no hay', () => {
    expect(describeDevice('pruebas')).toBe('pruebas');
    expect(describeDevice(null)).toBeNull();
  });
});
