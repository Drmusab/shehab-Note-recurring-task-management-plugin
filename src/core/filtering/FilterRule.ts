export type FilterRuleType = 'tag' | 'regex' | 'path' | 'marker';

export interface FilterRule {
  id: string;
  type: FilterRuleType;
  pattern: string;
  enabled: boolean;
  description?: string;
}

export interface GlobalFilterConfig {
  enabled: boolean;
  mode: 'include' | 'exclude' | 'all';
  rules: FilterRule[];
}

/**
 * Validate a filter rule
 */
export function validateFilterRule(rule: FilterRule): { valid: boolean; error?: string } {
  // Check pattern is not empty
  if (!rule.pattern || rule.pattern.trim().length === 0) {
    return { valid: false, error: 'Pattern cannot be empty' };
  }

  // Validate based on type
  switch (rule.type) {
    case 'regex':
      try {
        new RegExp(rule.pattern);
        return { valid: true };
      } catch (e) {
        return { valid: false, error: `Invalid regex pattern: ${e instanceof Error ? e.message : String(e)}` };
      }
    
    case 'tag':
      // Tags should start with #
      if (!rule.pattern.startsWith('#')) {
        return { valid: false, error: 'Tag pattern should start with #' };
      }
      return { valid: true };
    
    case 'path':
    case 'marker':
      return { valid: true };
    
    default:
      return { valid: false, error: `Unknown rule type: ${rule.type}` };
  }
}

/**
 * Create a new filter rule
 */
export function createFilterRule(type: FilterRuleType, pattern: string, description?: string): FilterRule {
  // Use crypto.randomUUID() if available, fallback to timestamp-based ID
  const id = typeof crypto !== 'undefined' && crypto.randomUUID 
    ? `rule_${crypto.randomUUID()}`
    : `rule_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    
  return {
    id,
    type,
    pattern,
    enabled: true,
    description,
  };
}

/**
 * Default global filter configuration (all mode - no filtering)
 */
export const DEFAULT_GLOBAL_FILTER_CONFIG: GlobalFilterConfig = {
  enabled: false,
  mode: 'all',
  rules: [],
};
