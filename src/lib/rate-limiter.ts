// Simple in-memory rate limiter for API endpoints

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private cleanupMs: number = 60000) {
    this.cleanupInterval = setInterval(() => this.cleanup(), cleanupMs);
  }

  check(
    identifier: string,
    maxRequests: number,
    windowMs: number = 60000
  ): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = this.limits.get(identifier);

    if (!entry || now >= entry.resetAt) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetAt: now + windowMs,
      };
      this.limits.set(identifier, newEntry);
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetAt: newEntry.resetAt,
      };
    }

    if (entry.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
      };
    }

    entry.count += 1;
    this.limits.set(identifier, entry);

    return {
      allowed: true,
      remaining: maxRequests - entry.count,
      resetAt: entry.resetAt,
    };
  }

  reset(identifier: string): void {
    this.limits.delete(identifier);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now >= entry.resetAt) {
        this.limits.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.limits.clear();
  }
}

// Create singleton instances for different limit types
export const authRateLimiter = new RateLimiter();
export const apiRateLimiter = new RateLimiter();
export const adWatchRateLimiter = new RateLimiter();

// Helper functions for common rate limits
export function checkAuthRateLimit(identifier: string) {
  return authRateLimiter.check(identifier, 5, 60000); // 5 requests per minute
}

export function checkApiRateLimit(identifier: string) {
  return apiRateLimiter.check(identifier, 100, 60000); // 100 requests per minute
}

export function checkAdWatchRateLimit(userId: string, limit: number = 20) {
  return adWatchRateLimiter.check(userId, limit, 86400000); // limit per day
}

export function checkSurveyRateLimit(userId: string, limit: number = 10) {
  return apiRateLimiter.check(`survey:${userId}`, limit, 86400000); // limit per day
}

export function checkTaskRateLimit(userId: string, limit: number = 15) {
  return apiRateLimiter.check(`task:${userId}`, limit, 86400000); // limit per day
}

export function checkWithdrawalRateLimit(userId: string, limit: number = 3) {
  return apiRateLimiter.check(`withdrawal:${userId}`, limit, 604800000); // limit per week
}
