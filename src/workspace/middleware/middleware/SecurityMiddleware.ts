import { Request, Response, NextFunction } from 'express';
import { WebhookError } from '../types/Error';
import { SecurityConfig } from '../../config/WebhookConfig';

export class SecurityMiddleware {
  constructor(private config: SecurityConfig) {}

  /**
   * Validate HTTPS requirement
   */
  httpsValidator() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.requireHttps) {
        return next();
      }

      const context = (req as any).context;
      if (!context) {
        return next();
      }

      // Allow HTTP for localhost
      const isLocalhost = this.isLocalhost(context.clientIp);
      if (isLocalhost) {
        return next();
      }

      // Require HTTPS for external connections
      if (!context.isHttps) {
        return next(
          new WebhookError(
            'FORBIDDEN',
            'HTTPS required for external connections'
          )
        );
      }

      next();
    };
  }

  /**
   * Check if IP is localhost
   */
  private isLocalhost(ip: string): boolean {
    const localhostPatterns = ['127.0.0.1', 'localhost', '::1', '::ffff:127.0.0.1'];
    return localhostPatterns.some((pattern) => ip.includes(pattern));
  }

  /**
   * Request timeout handler
   */
  timeoutHandler() {
    return (req: Request, res: Response, next: NextFunction) => {
      req.setTimeout(this.config.requestTimeout, () => {
        next(new WebhookError('SERVICE_UNAVAILABLE', 'Request timeout'));
      });
      next();
    };
  }
}
