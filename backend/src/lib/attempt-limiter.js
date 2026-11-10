'use strict';

const createAttemptLimiter = ({ max, windowMs }) => {
  const attempts = new Map();

  const isBlocked = (key) => {
    const entry = attempts.get(key);
    if (!entry) return false;
    if (entry.resetAt <= Date.now()) {
      attempts.delete(key);
      return false;
    }
    return entry.count >= max;
  };

  const record = (key) => {
    const now = Date.now();
    const entry = attempts.get(key);
    if (entry && entry.resetAt > now) {
      entry.count += 1;
      return;
    }
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    for (const [storedKey, stored] of attempts) {
      if (stored.resetAt <= now) attempts.delete(storedKey);
    }
  };

  return { isBlocked, record };
};

module.exports = { createAttemptLimiter };
