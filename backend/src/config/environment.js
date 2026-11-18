class Environment {
  constructor(variables = process.env) {
    this.variables = variables;
  }

  text(name) {
    const value = this.variables[name];
    if (value === undefined) throw new Error(`Missing environment variable ${name}`);
    return value;
  }

  integer(name) {
    const value = this.text(name);
    if (!/^\d+$/.test(value)) throw new Error(`Environment variable ${name} must be a whole number`);
    return Number(value);
  }

  list(name) {
    return this.text(name)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

module.exports = Environment;
