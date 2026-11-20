const BROWSERS: [RegExp, string][] = [
  [/Edg\//, 'Edge'],
  [/OPR\/|Opera/, 'Opera'],
  [/Firefox\//, 'Firefox'],
  [/Chrome\//, 'Chrome'],
  [/Safari\//, 'Safari'],
];

const SYSTEMS: [RegExp, string][] = [
  [/Windows/, 'Windows'],
  [/Android/, 'Android'],
  [/iPhone|iPad|iOS/, 'iOS'],
  [/Mac OS X|Macintosh/, 'macOS'],
  [/Linux/, 'Linux'],
];

const firstMatch = (table: [RegExp, string][], text: string) => table.find(([pattern]) => pattern.test(text))?.[1];

export const describeDevice = (userAgent: string | null) => {
  if (!userAgent) return null;
  const browser = firstMatch(BROWSERS, userAgent);
  const system = firstMatch(SYSTEMS, userAgent);
  if (browser && system) return `${browser} en ${system}`;
  return browser ?? system ?? userAgent;
};
