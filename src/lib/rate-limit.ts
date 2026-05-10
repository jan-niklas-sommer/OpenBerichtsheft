const attempts = new Map<string, { count: number; lockedUntil: number }>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export function isRateLimited(key: string): boolean {
  const entry = attempts.get(key);
  if (!entry) return false;
  if (Date.now() > entry.lockedUntil) {
    attempts.delete(key);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

export function recordFailedAttempt(key: string): void {
  const entry = attempts.get(key) || { count: 0, lockedUntil: 0 };
  entry.count += 1;
  entry.lockedUntil = Date.now() + LOCKOUT_MS;
  attempts.set(key, entry);
}

export function clearAttempts(key: string): void {
  attempts.delete(key);
}

const genericAttempts = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, maxAttempts: number, windowMs: number): { success: boolean } {
  const now = Date.now();
  const entry = genericAttempts.get(key);
  if (!entry || now > entry.resetAt) {
    genericAttempts.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true };
  }
  entry.count += 1;
  if (entry.count > maxAttempts) {
    return { success: false };
  }
  return { success: true };
}

export function _resetAll() {
  attempts.clear();
  genericAttempts.clear();
}
