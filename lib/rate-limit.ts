interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

const MAX_REQUESTS = 15;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

export function checkRateLimit(identifier: string): {
  success: boolean;
  remaining: number;
  resetInSeconds: number;
} {
  const now = Date.now();
  const record = store[identifier];

  if (!record || now > record.resetTime) {
    store[identifier] = {
      count: 1,
      resetTime: now + WINDOW_MS,
    };
    return {
      success: true,
      remaining: MAX_REQUESTS - 1,
      resetInSeconds: Math.ceil(WINDOW_MS / 1000),
    };
  }

  if (record.count >= MAX_REQUESTS) {
    return {
      success: false,
      remaining: 0,
      resetInSeconds: Math.ceil((record.resetTime - now) / 1000),
    };
  }

  record.count += 1;
  return {
    success: true,
    remaining: MAX_REQUESTS - record.count,
    resetInSeconds: Math.ceil((record.resetTime - now) / 1000),
  };
}
