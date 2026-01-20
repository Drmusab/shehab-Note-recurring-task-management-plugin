import { describe, it, expect } from 'vitest';
import { validateFilterRule, createFilterRule, type FilterRule } from '@/core/filtering/FilterRule';

describe('FilterRule', () => {
  describe('validateFilterRule', () => {
    it('should validate tag pattern with #', () => {
      const rule = createFilterRule('tag', '#task');
      const result = validateFilterRule(rule);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject tag pattern without #', () => {
      const rule = createFilterRule('tag', 'task');
      const result = validateFilterRule(rule);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('should start with #');
    });

    it('should validate tag with wildcard', () => {
      const rule = createFilterRule('tag', '#work/*');
      const result = validateFilterRule(rule);
      expect(result.valid).toBe(true);
    });

    it('should validate valid regex pattern', () => {
      const rule = createFilterRule('regex', 'TODO:|TASK:');
      const result = validateFilterRule(rule);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid regex pattern', () => {
      const rule = createFilterRule('regex', '[invalid(');
      const result = validateFilterRule(rule);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid regex pattern');
    });

    it('should validate path pattern', () => {
      const rule = createFilterRule('path', 'projects/');
      const result = validateFilterRule(rule);
      expect(result.valid).toBe(true);
    });

    it('should validate marker pattern', () => {
      const rule = createFilterRule('marker', 'TODO:');
      const result = validateFilterRule(rule);
      expect(result.valid).toBe(true);
    });

    it('should reject empty pattern', () => {
      const rule: FilterRule = {
        id: 'test',
        type: 'tag',
        pattern: '',
        enabled: true,
      };
      const result = validateFilterRule(rule);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot be empty');
    });

    it('should reject whitespace-only pattern', () => {
      const rule: FilterRule = {
        id: 'test',
        type: 'tag',
        pattern: '   ',
        enabled: true,
      };
      const result = validateFilterRule(rule);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot be empty');
    });
  });

  describe('createFilterRule', () => {
    it('should create filter rule with valid pattern', () => {
      const rule = createFilterRule('tag', '#task');
      
      expect(rule.id).toBeTruthy();
      expect(rule.type).toBe('tag');
      expect(rule.pattern).toBe('#task');
      expect(rule.enabled).toBe(true);
    });

    it('should create filter rule with description', () => {
      const rule = createFilterRule('tag', '#task', 'Task filter');
      
      expect(rule.description).toBe('Task filter');
    });

    it('should generate unique IDs', () => {
      const rule1 = createFilterRule('tag', '#task');
      const rule2 = createFilterRule('tag', '#task');
      
      expect(rule1.id).not.toBe(rule2.id);
    });

    it('should create rule with enabled by default', () => {
      const rule = createFilterRule('tag', '#task');
      expect(rule.enabled).toBe(true);
    });

    it('should create rules for all types', () => {
      const tagRule = createFilterRule('tag', '#task');
      const regexRule = createFilterRule('regex', 'TODO:');
      const pathRule = createFilterRule('path', 'daily/');
      const markerRule = createFilterRule('marker', '@action');

      expect(tagRule.type).toBe('tag');
      expect(regexRule.type).toBe('regex');
      expect(pathRule.type).toBe('path');
      expect(markerRule.type).toBe('marker');
    });
  });
});
