export interface WebhookConfig {
  /** Server configuration */
  server: ServerConfig;

  /** Security configuration */
  security: SecurityConfig;

  /** Rate limiting configuration */
  rateLimits: RateLimitConfig;

  /** Idempotency configuration */
  idempotency: IdempotencyConfig;

  /** Error logging configuration */
  errorLogging: ErrorLoggingConfig;

  /** Recurrence limits configuration */
  recurrenceLimits: RecurrenceLimitsConfig;
}

export interface ServerConfig {
  /** Port configuration: 'auto' or specific port number */
  port: 'auto' | number;

  /** Host to bind to */
  host: string;

  /** Auto port detection range */
  autoPortRange: [number, number];

  /** Enable HTTP for localhost */
  enableHttp: boolean;

  /** Allowed localhost addresses */
  allowedLocalHosts: string[];
}

export interface SecurityConfig {
  /** Require HTTPS for non-localhost connections */
  requireHttps: boolean;

  /** Maximum request body size (bytes) */
  maxBodySize: number;

  /** Request timeout (ms) */
  requestTimeout: number;

  /** Failed auth attempt threshold before temporary block */
  maxFailedAuthAttempts: number;

  /** Duration of temporary IP block (ms) */
  authBlockDuration: number;
}

export interface RateLimitConfig {
  /** Query operations (list, get, history) */
  query: RateLimitRule;

  /** Task operations (create, update, complete) */
  task: RateLimitRule;

  /** Recurrence operations (pause, resume, skip) */
  recurrence: RateLimitRule;

  /** Notification operations (send) */
  notification: RateLimitRule;

  /** Workspace management */
  workspace: RateLimitRule;

  /** Auth operations (key creation/rotation) */
  auth: RateLimitRule;
}

export interface RateLimitRule {
  /** Maximum requests */
  limit: number;

  /** Time window (seconds) */
  windowSeconds: number;
}

export interface IdempotencyConfig {
  /** Cache duration (hours) */
  cacheDurationHours: number;

  /** Maximum idempotency key length */
  maxKeyLength: number;

  /** Cleanup interval (hours) */
  cleanupIntervalHours: number;
}

export interface ErrorLoggingConfig {
  /** Enable error logging UI */
  enableUI: boolean;

  /** In-memory buffer size (per workspace) */
  bufferSize: number;

  /** Persist errors to disk */
  persistToDisk: boolean;

  /** Log file rotation (days) */
  rotationDays: number;

  /** Maximum log file size (MB) */
  maxFileSizeMB: number;

  /** Enable optional document logging */
  enableDocumentLogging: boolean;

  /** Only log critical errors to documents */
  deadLetterMode: boolean;

  /** Document path in SiyuanNote */
  documentPath: string;

  /** Format: 'daily-summary' or 'per-error' */
  format: 'daily-summary' | 'per-error';
}

export interface RecurrenceLimitsConfig {
  /** Minimum interval */
  minimumInterval: {
    minutes: number;
    requiresConfirmation: boolean;
  };

  /** Horizon configuration */
  horizonDays: {
    default: number;
    advanced: number;
    maximum: number;
  };

  /** Maximum calculation iterations */
  maxCalculationIterations: number;

  /** Maximum annual tasks */
  maxAnnualTasks: number;

  /** Enable high-frequency warnings */
  enableHighFrequencyWarnings: boolean;
}

/**
 * Default configuration
 */
export const DEFAULT_WEBHOOK_CONFIG: WebhookConfig = {
  server: {
    port: 'auto',
    host: '127.0.0.1',
    autoPortRange: [8000, 8100],
    enableHttp: true,
    allowedLocalHosts: ['127.0.0.1', 'localhost', '::1'],
  },
  security: {
    requireHttps: true,
    maxBodySize: 1048576, // 1MB
    requestTimeout: 30000, // 30s
    maxFailedAuthAttempts: 5,
    authBlockDuration: 300000, // 5 minutes
  },
  rateLimits: {
    query: { limit: 120, windowSeconds: 60 },
    task: { limit: 60, windowSeconds: 60 },
    recurrence: { limit: 30, windowSeconds: 60 },
    notification: { limit: 10, windowSeconds: 60 },
    workspace: { limit: 10, windowSeconds: 3600 },
    auth: { limit: 5, windowSeconds: 3600 },
  },
  idempotency: {
    cacheDurationHours: 24,
    maxKeyLength: 255,
    cleanupIntervalHours: 1,
  },
  errorLogging: {
    enableUI: true,
    bufferSize: 100,
    persistToDisk: true,
    rotationDays: 30,
    maxFileSizeMB: 10,
    enableDocumentLogging: false,
    deadLetterMode: true,
    documentPath: '/Logs/RTM-Errors/',
    format: 'daily-summary',
  },
  recurrenceLimits: {
    minimumInterval: {
      minutes: 1,
      requiresConfirmation: true,
    },
    horizonDays: {
      default: 365,
      advanced: 730,
      maximum: 1095,
    },
    maxCalculationIterations: 1000,
    maxAnnualTasks: 10000,
    enableHighFrequencyWarnings: true,
  },
};
