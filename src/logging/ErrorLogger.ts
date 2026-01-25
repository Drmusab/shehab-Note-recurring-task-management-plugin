import { ErrorLogStore } from './ErrorLogStore';
import { DocumentLogger } from './DocumentLogger';
import { ErrorLoggingConfig } from '../config/WebhookConfig';
import { ErrorCode } from '../webhook/types/Response';

export interface ErrorLogEntry {
  id: string;
  timestamp: string;
  workspaceId: string;
  command: string;
  source: string;
  requestId: string;
  errorCode: ErrorCode;
  errorMessage: string;
  requestData: any;
  stackTrace?: string;
  userAgent?: string;
  ipAddress?: string;
  resolved: boolean;
}

export class ErrorLogger {
  private memoryBuffer: Map<string, ErrorLogEntry[]> = new Map();

  constructor(
    private store: ErrorLogStore,
    private docLogger: DocumentLogger,
    private config: ErrorLoggingConfig
  ) {}

  /**
   * Log error
   */
  async logError(
    workspaceId: string,
    command: string,
    source: string,
    requestId: string,
    errorCode: ErrorCode,
    errorMessage: string,
    requestData: any,
    context?: {
      stackTrace?: string;
      userAgent?: string;
      ipAddress?: string;
    }
  ): Promise<void> {
    const entry: ErrorLogEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      workspaceId,
      command,
      source,
      requestId,
      errorCode,
      errorMessage,
      requestData,
      stackTrace: context?.stackTrace,
      userAgent: context?.userAgent,
      ipAddress: context?.ipAddress,
      resolved: false,
    };

    // Add to memory buffer
    this.addToBuffer(workspaceId, entry);

    // Persist to disk if enabled
    if (this.config.persistToDisk) {
      await this.store.appendError(entry);
    }

    // Log to documents if critical and enabled
    if (this.shouldLogToDocument(errorCode)) {
      await this.docLogger.logError(entry);
    }
  }

  /**
   * Get recent errors for workspace
   */
  getRecentErrors(workspaceId: string, limit?: number): ErrorLogEntry[] {
    const entries = this.memoryBuffer.get(workspaceId) || [];
    return limit ? entries.slice(0, limit) : entries;
  }

  /**
   * Mark error as resolved
   */
  async resolveError(workspaceId: string, errorId: string): Promise<void> {
    const entries = this.memoryBuffer.get(workspaceId);
    if (entries) {
      const entry = entries.find((e) => e.id === errorId);
      if (entry) {
        entry.resolved = true;
        if (this.config.persistToDisk) {
          await this.store.updateError(entry);
        }
      }
    }
  }

  /**
   * Clear resolved errors
   */
  clearResolved(workspaceId: string): void {
    const entries = this.memoryBuffer.get(workspaceId);
    if (entries) {
      const unresolved = entries.filter((e) => !e.resolved);
      this.memoryBuffer.set(workspaceId, unresolved);
    }
  }

  /**
   * Add entry to memory buffer
   */
  private addToBuffer(workspaceId: string, entry: ErrorLogEntry): void {
    let entries = this.memoryBuffer.get(workspaceId);
    if (!entries) {
      entries = [];
      this.memoryBuffer.set(workspaceId, entries);
    }

    // Add to front (newest first)
    entries.unshift(entry);

    // Limit buffer size
    if (entries.length > this.config.bufferSize) {
      entries.pop();
    }
  }

  /**
   * Determine if error should be logged to documents
   */
  private shouldLogToDocument(errorCode: ErrorCode): boolean {
    if (!this.config.enableDocumentLogging) {
      return false;
    }

    if (this.config.deadLetterMode) {
      // Only critical errors
      const criticalErrors: ErrorCode[] = [
        'INTERNAL_ERROR',
        'STORAGE_ERROR',
        'SERVICE_UNAVAILABLE',
      ];
      return criticalErrors.includes(errorCode);
    }

    return true;
  }

  /**
   * Generate unique error ID
   */
  private generateId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
