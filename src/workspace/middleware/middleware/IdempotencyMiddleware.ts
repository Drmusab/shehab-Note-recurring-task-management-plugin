import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import { IdempotencyConfig } from '../../config/WebhookConfig';

interface IdempotencyRecord {
  key: string;
  workspaceId: string;
  command: string;
  requestHash: string;
  responseData: any;
  createdAt: number;
  expiresAt: number;
}

export class IdempotencyMiddleware {
  private cache: Map<string, IdempotencyRecord> = new Map();

  constructor(private config: IdempotencyConfig) {
    // Cleanup expired keys hourly
    setInterval(() => this.cleanup(), config.cleanupIntervalHours * 3600000);
  }

  /**
   * Express middleware function
   */
  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const context = (req as any).context;
      const body = req.body;

      if (!context || !body?.meta?.idempotencyKey) {
        return next(); // No idempotency key, proceed normally
      }

      const idempotencyKey = body.meta.idempotencyKey;
      const command = body.command;
      const workspaceId = context.workspaceId;

      // Create cache key: workspace + command + idempotency key
      const cacheKey = `${workspaceId}:${command}:${idempotencyKey}`;

      // Check if we've seen this request before
      const existing = this.cache.get(cacheKey);
      if (existing && !this.isExpired(existing)) {
        // Verify request is identical
        const currentHash = this.hashRequest(body.data);
        if (currentHash !== existing.requestHash) {
          // Same idempotency key but different request data
          const error = new Error('Idempotency key conflict: same key with different request data');
          (error as any).statusCode = 409;
          return next(error);
        }

        // Return cached response
        const response = {
          ...existing.responseData,
          meta: {
            ...existing.responseData.meta,
            idempotencyKey,
            firstSeen: false,
            originalTimestamp: new Date(existing.createdAt).toISOString(),
          },
        };

        return res.status(200).json(response);
      }

      // Store original res.json to intercept response
      const originalJson = res.json.bind(res);
      res.json = (data: any) => {
        // Only cache successful responses
        if (data.success) {
          const now = Date.now();
          const record: IdempotencyRecord = {
            key: idempotencyKey,
            workspaceId,
            command,
            requestHash: this.hashRequest(body.data),
            responseData: data,
            createdAt: now,
            expiresAt: now + this.config.cacheDurationHours * 3600000,
          };

          this.cache.set(cacheKey, record);

          // Add idempotency metadata
          data.meta = {
            ...data.meta,
            idempotencyKey,
            firstSeen: true,
          };
        }

        return originalJson(data);
      };

      next();
    };
  }

  /**
   * Hash request data for comparison
   */
  private hashRequest(data: any): string {
    const json = JSON.stringify(data);
    return createHash('sha256').update(json).digest('hex');
  }

  /**
   * Check if record is expired
   */
  private isExpired(record: IdempotencyRecord): boolean {
    return Date.now() > record.expiresAt;
  }

  /**
   * Cleanup expired records
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.cache.entries()) {
      if (now > record.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}
