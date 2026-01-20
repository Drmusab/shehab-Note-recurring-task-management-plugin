import type { GlobalFilterConfig, FilterRule } from './FilterRule';

/**
 * Engine for evaluating global filter rules
 */
export class GlobalFilterEngine {
  private config: GlobalFilterConfig;

  constructor(config: GlobalFilterConfig) {
    this.config = config;
  }

  /**
   * Evaluate whether a block should be treated as a task
   * @param blockContent - The markdown content of the block
   * @param blockPath - Optional path to the document (for path filtering)
   * @returns true if block passes filter (should be treated as task)
   */
  evaluate(blockContent: string, blockPath?: string): boolean {
    // If disabled or mode is 'all', pass everything
    if (!this.config.enabled || this.config.mode === 'all') {
      return true;
    }

    const activeRules = this.config.rules.filter(r => r.enabled);
    if (activeRules.length === 0) {
      // No rules = pass all (default behavior)
      return true;
    }

    // Evaluate each rule
    const matches = activeRules.map(rule =>
      this.evaluateRule(rule, blockContent, blockPath)
    );

    const anyMatch = matches.some(m => m);

    // Include mode: pass if ANY rule matches
    // Exclude mode: pass if NO rule matches
    return this.config.mode === 'include' ? anyMatch : !anyMatch;
  }

  /**
   * Update filter configuration
   */
  updateConfig(config: GlobalFilterConfig): void {
    this.config = config;
  }

  /**
   * Get current configuration
   */
  getConfig(): GlobalFilterConfig {
    return this.config;
  }

  /**
   * Test a single rule against content
   */
  private evaluateRule(rule: FilterRule, content: string, path?: string): boolean {
    switch (rule.type) {
      case 'tag':
        const tags = this.extractTags(content);
        // Support wildcards: #work/* matches #work/urgent
        const pattern = rule.pattern.replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);
        return tags.some(tag => regex.test(tag));

      case 'regex':
        try {
          const regex = new RegExp(rule.pattern);
          return regex.test(content);
        } catch {
          return false; // Invalid regex = no match
        }

      case 'path':
        if (!path) return false;
        return path.includes(rule.pattern);

      case 'marker':
        // Custom marker like "TODO:", "TASK:"
        return content.includes(rule.pattern);

      default:
        return false;
    }
  }

  /**
   * Extract tags from content
   */
  private extractTags(content: string): string[] {
    const tagMatches = content.match(/#[\w/-]+/g);
    return tagMatches || [];
  }
}
