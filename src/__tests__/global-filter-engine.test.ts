import { describe, it, expect, beforeEach } from 'vitest';
import { GlobalFilterEngine } from '@/core/filtering/GlobalFilterEngine';
import { createFilterRule, type GlobalFilterConfig } from '@/core/filtering/FilterRule';

describe('GlobalFilterEngine', () => {
  let engine: GlobalFilterEngine;
  let config: GlobalFilterConfig;

  beforeEach(() => {
    config = {
      enabled: true,
      mode: 'include',
      rules: [],
      excludeFolders: [],
      excludeNotebooks: [],
      excludeTags: [],
      excludeFilePatterns: [],
      excludeStatusTypes: [],
    };
    engine = new GlobalFilterEngine(config);
  });

  describe('evaluate - mode all', () => {
    it('should pass all blocks when mode is "all"', () => {
      config.mode = 'all';
      engine.updateConfig(config);
      
      expect(engine.evaluate('- [ ] Task without tags')).toBe(true);
      expect(engine.evaluate('- [ ] Task with #tag')).toBe(true);
      expect(engine.evaluate('- [x] Done task')).toBe(true);
    });

    it('should pass all blocks when disabled', () => {
      config.enabled = false;
      engine.updateConfig(config);
      
      expect(engine.evaluate('- [ ] Any task')).toBe(true);
      expect(engine.evaluate('- [ ] Another task')).toBe(true);
    });
  });

  describe('evaluate - tag filtering', () => {
    it('should match blocks with exact tag in include mode', () => {
      config.mode = 'include';
      config.rules = [createFilterRule('tag', '#task')];
      engine.updateConfig(config);

      expect(engine.evaluate('- [ ] Do something #task')).toBe(true);
      expect(engine.evaluate('- [ ] Do something #other')).toBe(false);
      expect(engine.evaluate('- [ ] Do something')).toBe(false);
    });

    it('should match blocks with wildcard tags', () => {
      config.mode = 'include';
      config.rules = [createFilterRule('tag', '#work/*')];
      engine.updateConfig(config);

      expect(engine.evaluate('- [ ] Task #work/urgent')).toBe(true);
      expect(engine.evaluate('- [ ] Task #work/project')).toBe(true);
      expect(engine.evaluate('- [ ] Task #work')).toBe(false);
      expect(engine.evaluate('- [ ] Task #personal')).toBe(false);
    });

    it('should handle multiple tags in content', () => {
      config.mode = 'include';
      config.rules = [createFilterRule('tag', '#task')];
      engine.updateConfig(config);

      expect(engine.evaluate('- [ ] Do something #task #urgent')).toBe(true);
      expect(engine.evaluate('- [ ] Do something #urgent #task')).toBe(true);
    });
  });

  describe('evaluate - regex filtering', () => {
    it('should match blocks with regex pattern', () => {
      config.mode = 'include';
      config.rules = [createFilterRule('regex', 'TODO:|TASK:')];
      engine.updateConfig(config);

      expect(engine.evaluate('- [ ] TODO: Implement feature')).toBe(true);
      expect(engine.evaluate('- [ ] TASK: Fix bug')).toBe(true);
      expect(engine.evaluate('- [ ] Do something')).toBe(false);
    });

    it('should handle invalid regex gracefully', () => {
      config.mode = 'include';
      config.rules = [createFilterRule('regex', '[invalid(')];
      engine.updateConfig(config);

      expect(engine.evaluate('- [ ] Any task')).toBe(false);
    });

    it('should match case-sensitive by default', () => {
      config.mode = 'include';
      config.rules = [createFilterRule('regex', 'TODO')];
      engine.updateConfig(config);

      expect(engine.evaluate('- [ ] TODO: task')).toBe(true);
      expect(engine.evaluate('- [ ] todo: task')).toBe(false);
    });
  });

  describe('evaluate - path filtering', () => {
    it('should match blocks from specific path', () => {
      config.mode = 'include';
      config.rules = [createFilterRule('path', 'daily/')];
      engine.updateConfig(config);

      expect(engine.evaluate('- [ ] Task', 'daily/2024-01-20.md')).toBe(true);
      expect(engine.evaluate('- [ ] Task', 'projects/work.md')).toBe(false);
    });

    it('should return false when no path provided', () => {
      config.mode = 'include';
      config.rules = [createFilterRule('path', 'daily/')];
      engine.updateConfig(config);

      expect(engine.evaluate('- [ ] Task')).toBe(false);
    });

    it('should match partial paths', () => {
      config.mode = 'include';
      config.rules = [createFilterRule('path', 'projects/')];
      engine.updateConfig(config);

      expect(engine.evaluate('- [ ] Task', 'notes/projects/work.md')).toBe(true);
      expect(engine.evaluate('- [ ] Task', 'projects/personal/ideas.md')).toBe(true);
    });
  });

  describe('evaluate - marker filtering', () => {
    it('should match blocks with text marker', () => {
      config.mode = 'include';
      config.rules = [createFilterRule('marker', 'TODO:')];
      engine.updateConfig(config);

      expect(engine.evaluate('- [ ] TODO: Do something')).toBe(true);
      expect(engine.evaluate('- [ ] Do something')).toBe(false);
    });

    it('should match custom markers', () => {
      config.mode = 'include';
      config.rules = [createFilterRule('marker', '@action')];
      engine.updateConfig(config);

      expect(engine.evaluate('- [ ] @action Review PR')).toBe(true);
      expect(engine.evaluate('- [ ] @note Take notes')).toBe(false);
    });
  });

  describe('evaluate - exclude mode', () => {
    it('should exclude blocks matching tag rule', () => {
      config.mode = 'exclude';
      config.rules = [createFilterRule('tag', '#ignore')];
      engine.updateConfig(config);

      expect(engine.evaluate('- [ ] Task #ignore')).toBe(false);
      expect(engine.evaluate('- [ ] Task #task')).toBe(true);
      expect(engine.evaluate('- [ ] Task')).toBe(true);
    });

    it('should exclude blocks matching regex', () => {
      config.mode = 'exclude';
      config.rules = [createFilterRule('regex', 'SKIP:')];
      engine.updateConfig(config);

      expect(engine.evaluate('- [ ] SKIP: This task')).toBe(false);
      expect(engine.evaluate('- [ ] Do this task')).toBe(true);
    });
  });

  describe('evaluate - multiple rules', () => {
    it('should pass if ANY rule matches in include mode', () => {
      config.mode = 'include';
      config.rules = [
        createFilterRule('tag', '#task'),
        createFilterRule('tag', '#todo'),
      ];
      engine.updateConfig(config);

      expect(engine.evaluate('- [ ] Item #task')).toBe(true);
      expect(engine.evaluate('- [ ] Item #todo')).toBe(true);
      expect(engine.evaluate('- [ ] Item #other')).toBe(false);
    });

    it('should pass if NO rule matches in exclude mode', () => {
      config.mode = 'exclude';
      config.rules = [
        createFilterRule('tag', '#ignore'),
        createFilterRule('tag', '#skip'),
      ];
      engine.updateConfig(config);

      expect(engine.evaluate('- [ ] Item #ignore')).toBe(false);
      expect(engine.evaluate('- [ ] Item #skip')).toBe(false);
      expect(engine.evaluate('- [ ] Item #task')).toBe(true);
    });

    it('should combine different rule types', () => {
      config.mode = 'include';
      config.rules = [
        createFilterRule('tag', '#task'),
        createFilterRule('marker', 'TODO:'),
      ];
      engine.updateConfig(config);

      expect(engine.evaluate('- [ ] Item #task')).toBe(true);
      expect(engine.evaluate('- [ ] TODO: Item')).toBe(true);
      expect(engine.evaluate('- [ ] Item')).toBe(false);
    });
  });

  describe('evaluate - disabled rules', () => {
    it('should ignore disabled rules', () => {
      const rule1 = createFilterRule('tag', '#task');
      const rule2 = createFilterRule('tag', '#todo');
      rule2.enabled = false;

      config.mode = 'include';
      config.rules = [rule1, rule2];
      engine.updateConfig(config);

      expect(engine.evaluate('- [ ] Item #task')).toBe(true);
      expect(engine.evaluate('- [ ] Item #todo')).toBe(false);
    });

    it('should pass all when no active rules', () => {
      const rule = createFilterRule('tag', '#task');
      rule.enabled = false;

      config.mode = 'include';
      config.rules = [rule];
      engine.updateConfig(config);

      expect(engine.evaluate('- [ ] Any item')).toBe(true);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      const newConfig: GlobalFilterConfig = {
        enabled: true,
        mode: 'exclude',
        rules: [createFilterRule('tag', '#skip')],
        excludeFolders: [],
        excludeNotebooks: [],
        excludeTags: [],
        excludeFilePatterns: [],
        excludeStatusTypes: [],
      };

      engine.updateConfig(newConfig);
      expect(engine.getConfig()).toEqual(newConfig);
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', () => {
      const currentConfig = engine.getConfig();
      expect(currentConfig).toEqual(config);
    });
  });
});
