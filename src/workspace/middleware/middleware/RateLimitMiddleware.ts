import { Request, Response, NextFunction } from 'express';
import { WebhookError } from '../types/Error';
import { RateLimitConfig, RateLimitRule } from '../../config/WebhookConfig';

/**
 * Rate limit bucket for sliding window
 */
interface RateLimitBucket {
  requests: number[];
  windowStart: number;
}

export class RateLimitMiddleware {
  private buckets: Map<string, RateLimitBucket> = new Map();

  constructor(private config: RateLimitConfig) {
    // Cleanup old buckets every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Express middleware function
   */
  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = (req as any).context;
        if (!context) {
          throw new WebhookError('INTERNAL_ERROR', 'Missing request context');
        }

        const command = (req.body as any)?.command;
        if (!command) {
          return next(); // Will be caught by validator
        }

        // Determine rate limit rule based on command
        const rule = this.getRuleForcCommand(command);
        if (!rule) {
          return next(); // No rate limit for this command
        }

        // Create bucket key: workspace + command category
        const bucketKey = `${context.workspaceId}:${this.getCommandCategory(command)}`;

        // Check rate limit
        const { allowed, remaining, resetTime } = this.checkLimit(bucketKey, rule);

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', rule.limit);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining));
        res.setHeader('X-RateLimit-Reset', Math.floor(resetTime / 1000));

        if (!allowed) {
          const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
          res.setHeader('Retry-After', retryAfter);

          throw new WebhookError(
            'RATE_LIMIT_EXCEEDED',
            `Rate limit exceeded for ${this.getCommandCategory(command)} operations`,
            {
              limit: rule.limit,
              window: `${rule.windowSeconds}s`,
              retryAfter,
              currentUsage: rule.limit + 1,
            }
          );
        }

        // Record request
        this.recordRequest(bucketKey, rule);

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Get rate limit rule for command
   */
  private getRuleForCommand(command: string): RateLimitRule | null {
    const category = this.getCommandCategory(command);
    return this.config[category as keyof RateLimitConfig] || null;
  }

  /**
   * Extract command category from full command
   */
  private getCommandCategory(command: string): string {
    // v1/tasks/create -> tasks -> task
    const match = command.match(/^v\d+\/([^/]+)/);
    if (!match) return 'unknown';

    const category = match[1];
    
    // Map plural to singular for config lookup
    if (category === 'tasks') return 'task';
    if (category === 'workspaces') return 'workspace';
    if (category === 'notifications') return 'notification';
    
    return category;
  }

  /**
   * Check if request is within rate limit
   */
  private checkLimit(
    bucketKey: string,
    rule: RateLimitRule
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const windowMs = rule.windowSeconds * 1000;
    
    let bucket = this.buckets.get(bucketKey);
    if (!bucket) {
      bucket = { requests: [], windowStart: now };
      this.buckets.set(bucketKey, bucket);
    }

    // Remove requests outside current window
    const windowStart = now - windowMs;
    bucket.requests = bucket.requests.filter((time) => time > windowStart);

    const currentCount = bucket.requests.length;
    const allowed = currentCount < rule.limit;
    const remaining = Math.max(0, rule.limit - currentCount);
    const resetTime = bucket.windowStart + windowMs;

    return { allowed, remaining, resetTime };
  }

  /**
   * Record request timestamp
   */
  private recordRequest(bucketKey: string, rule: RateLimitRule): void {
    const bucket = this.buckets.get(bucketKey);
    if (bucket) {
      bucket.requests.push(Date.now());
    }
  }

  /**
   * Cleanup old buckets
   */
  private cleanup(): void {
    const now = Date.now();
    const maxWindowMs = 3600000; // 1 hour

    for (const [key, bucket] of this.buckets.entries()) {
      const age = now - bucket.windowStart;
      if (age > maxWindowMs && bucket.requests.length === 0) {
        this.buckets.delete(key);
      }
    }
  }
}
