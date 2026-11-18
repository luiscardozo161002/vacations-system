class AttemptLimiter {
  constructor({ max, windowMs }) {
    this.max = max;
    this.windowMs = windowMs;
    this.attempts = new Map();
  }

  isBlocked(key) {
    const entry = this.attempts.get(key);
    if (!entry) return false;
    if (entry.resetAt <= Date.now()) {
      this.attempts.delete(key);
      return false;
    }
    return entry.count >= this.max;
  }

  record(key) {
    const now = Date.now();
    const entry = this.attempts.get(key);
    if (entry && entry.resetAt > now) {
      entry.count += 1;
      return;
    }
    this.attempts.set(key, { count: 1, resetAt: now + this.windowMs });
    this.removeExpired(now);
  }

  removeExpired(now) {
    for (const [key, entry] of this.attempts) {
      if (entry.resetAt <= now) this.attempts.delete(key);
    }
  }
}

module.exports = AttemptLimiter;
