import { GlobalFilterEngine } from './GlobalFilterEngine';
import type { GlobalFilterConfig } from './FilterRule';
import { DEFAULT_GLOBAL_FILTER_CONFIG } from './FilterRule';
import type { Task } from '@/core/models/Task';

/**
 * Main entry point for global filtering
 * Singleton pattern for application-wide filter state
 */
export class GlobalFilter {
  private static instance: GlobalFilter | null = null;
  private engine: GlobalFilterEngine;

  private constructor() {
    this.engine = new GlobalFilterEngine(DEFAULT_GLOBAL_FILTER_CONFIG);
  }

  /**
   * Get singleton instance
   */
  static getInstance(): GlobalFilter {
    if (!GlobalFilter.instance) {
      GlobalFilter.instance = new GlobalFilter();
    }
    return GlobalFilter.instance;
  }

  /**
   * Initialize with configuration
   */
  initialize(config: GlobalFilterConfig): void {
    this.engine.updateConfig(config);
  }

  /**
   * Check if a checkbox line should be treated as a task
   * Call BEFORE parsing
   */
  shouldTreatAsTask(blockContent: string, blockPath?: string): boolean {
    return this.engine.evaluate(blockContent, blockPath);
  }

  /**
   * Check if a parsed task should be included (for previews)
   */
  shouldIncludeTask(task: Task): boolean {
    return this.engine.evaluateTask(task);
  }

  /**
   * Get current configuration
   */
  getConfig(): GlobalFilterConfig {
    return this.engine.getConfig();
  }

  /**
   * Update configuration
   */
  updateConfig(config: GlobalFilterConfig): void {
    this.engine.updateConfig(config);
  }

  /**
   * Reset to default configuration (for testing)
   */
  reset(): void {
    this.engine.updateConfig(DEFAULT_GLOBAL_FILTER_CONFIG);
  }
}
