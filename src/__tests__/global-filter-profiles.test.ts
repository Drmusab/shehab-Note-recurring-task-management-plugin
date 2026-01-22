import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CompiledGlobalFilter, GlobalFilter } from '@/core/filtering/GlobalFilter';
import type { GlobalFilterProfile, GlobalFilterConfig } from '@/core/filtering/FilterRule';
import { DEFAULT_PROFILE, validateProfile } from '@/core/filtering/FilterRule';
import { createTask } from '@/core/models/Task';
import type { Task } from '@/core/models/Task';

describe('CompiledGlobalFilter', () => {
  let profile: GlobalFilterProfile;
  
  beforeEach(() => {
    profile = {
      id:  'test',
      name: 'Test Profile',
      includePaths: [],
      excludePaths:  [],
      includeTags: [],
      excludeTags: [],
      includeRegex: undefined,
      excludeRegex:  undefined,
      regexTargets: ['taskText'],
      excludeStatusTypes: [],
    };
  });
  
  describe('Path filtering', () => {
    it('should exclude path wins over include path', () => {
      profile.includePaths = ['daily/**'];
      profile.excludePaths = ['daily/archive/**'];
      
      const filter = new CompiledGlobalFilter(profile);
      
      const task = createTask('Task', { type: 'daily', interval: 1 });
      task.path = 'daily/archive/2024-01-01.md';
      
      expect(filter.matches(task)).toBe(false);
      
      const decision = filter.explain(task);
      expect(decision. included).toBe(false);
      expect(decision.matchedRule?. type).toBe('excludePath');
      expect(decision.reason).toContain('Excluded by path pattern');
    });
    
    it('should match glob patterns correctly', () => {
      profile. includePaths = ['projects/**'];
      
      const filter = new CompiledGlobalFilter(profile);
      
      const task1 = createTask('Task 1', { type: 'daily', interval: 1 });
      task1.path = 'projects/work/project1.md';
      
      const task2 = createTask('Task 2', { type: 'daily', interval: 1 });
      task2.path = 'daily/2024-01-01.md';
      
      expect(filter. matches(task1)).toBe(true);
      expect(filter. matches(task2)).toBe(false);
    });
    
    it('should handle wildcard patterns', () => {
      profile.includePaths = ['*/active/**'];
      
      const filter = new CompiledGlobalFilter(profile);
      
      const task1 = createTask('Task 1', { type: 'daily', interval: 1 });
      task1.path = 'projects/active/task. md';
      
      const task2 = createTask('Task 2', { type: 'daily', interval: 1 });
      task2.path = 'work/active/task.md';
      
      const task3 = createTask('Task 3', { type: 'daily', interval: 1 });
      task3.path = 'projects/done/task.md';
      
      expect(filter.matches(task1)).toBe(true);
      expect(filter.matches(task2)).toBe(true);
      expect(filter.matches(task3)).toBe(false);
    });
    
    it('should handle tasks without path when includePaths is set', () => {
      profile. includePaths = ['daily/**'];
      
      const filter = new CompiledGlobalFilter(profile);
      
      const task = createTask('Task', { type: 'daily', interval:  1 });
      // No path set
      
      const decision = filter.explain(task);
      expect(decision.included).toBe(false);
      expect(decision.reason).toContain('no path metadata');
    });
    
    it('should allow tasks without path when includePaths is empty', () => {
      profile. includePaths = [];
      
      const filter = new CompiledGlobalFilter(profile);
      
      const task = createTask('Task', { type: 'daily', interval: 1 });
      // No path set
      
      expect(filter.matches(task)).toBe(true);
    });
    
    it('should normalize paths with backslashes', () => {
      profile.excludePaths = ['archive/**'];
      
      const filter = new CompiledGlobalFilter(profile);
      
      const task = createTask('Task', { type: 'daily', interval:  1 });
      task.path = 'archive\\2024\\task.md'; // Windows-style path
      
      expect(filter.matches(task)).toBe(false);
    });
  });
  
  describe('Tag filtering', () => {
    it('should be boundary-safe (#work ≠ #workshop)', () => {
      profile. includeTags = ['#work'];
      
      const filter = new CompiledGlobalFilter(profile);
      
      const task1 = createTask('Task 1', { type: 'daily', interval: 1 });
      task1.tags = ['#work'];
      
      const task2 = createTask('Task 2', { type:  'daily', interval: 1 });
      task2.tags = ['#workshop'];
      
      expect(filter.matches(task1)).toBe(true);
      expect(filter.matches(task2)).toBe(false);
    });
    
    it('should exclude tag wins over include tag', () => {
      profile.includeTags = ['#work'];
      profile. excludeTags = ['#archive'];
      
      const filter = new CompiledGlobalFilter(profile);
      
      const task = createTask('Task', { type:  'daily', interval: 1 });
      task.tags = ['#work', '#archive'];
      
      expect(filter.matches(task)).toBe(false);
      
      const decision = filter.explain(task);
      expect(decision.matchedRule?.type).toBe('excludeTag');
      expect(decision. matchedRule?.pattern).toBe('#archive');
    });
    
    it('should normalize tags (case-insensitive)', () => {
      profile.includeTags = ['#Work'];
      
      const filter = new CompiledGlobalFilter(profile);
      
      const task = createTask('Task', { type: 'daily', interval: 1 });
      task.tags = ['#work'];
      
      expect(filter.matches(task)).toBe(true);
    });
    
    it('should handle tags with and without # prefix', () => {
      profile. includeTags = ['work']; // No # prefix
      
      const filter = new CompiledGlobalFilter(profile);
      
      const task = createTask('Task', { type: 'daily', interval: 1 });
      task.tags = ['#work']; // With # prefix
      
      expect(filter.matches(task)).toBe(true);
    });
    
    it('should handle tasks without tags when includeTags is set', () => {
      profile.includeTags = ['#task'];
      
      const filter = new CompiledGlobalFilter(profile);
      
      const task = createTask('Task', { type: 'daily', interval: 1 });
      // No tags
      
      const decision = filter.explain(task);
      expect(decision.included).toBe(false);
      expect(decision.reason).toContain('no tags');
    });
    
    it('should allow tasks without tags when includeTags is empty', () => {
      profile. includeTags = [];
      
      const filter = new CompiledGlobalFilter(profile);
      
      const task = createTask('Task', { type: 'daily', interval: 1 });
      // No tags
      
      expect(filter.matches(task)).toBe(true);
    });
    
    it('should match at least one tag from includeTags', () => {
      profile.includeTags = ['#work', '#personal'];
      
      const filter = new CompiledGlobalFilter(profile);
      
      const task1 = createTask('Task 1', { type: 'daily', interval: 1 });
      task1.tags = ['#work'];
      
      const task2 = createTask('Task 2', { type: 'daily', interval: 1 });
      task2.tags = ['#personal'];
      
      const task3 = createTask('Task 3', { type: 'daily', interval: 1 });
      task3.tags = ['#study'];
      
      expect(filter.matches(task1)).toBe(true);
      expect(filter.matches(task2)).toBe(true);
      expect(filter.matches(task3)).toBe(false);
    });
    
    it('should handle tags with slashes', () => {
      profile.includeTags = ['#project/alpha'];
      
      const filter = new CompiledGlobalFilter(profile);
      
      const task = createTask('Task', { type: 'daily', interval: 1 });
      task.tags = ['#project/alpha'];
      
      expect(filter.matches(task)).toBe(true);
    });
  });
  
  describe('Regex filtering', () => {
    it('should exclude regex wins over include regex', () => {
      profile.includeRegex = 'TODO';
      profile.excludeRegex = 'DRAFT';
      
      const filter = new CompiledGlobalFilter(profile);
      
      const task = createTask('TODO DRAFT task', { type: 'daily', interval: 1 });
      
      expect(filter.matches(task)).toBe(false);
      
      const decision = filter.explain(task);
      expect(decision.matchedRule?.type).toBe('excludeRegex');
    });
    
    it('should disable invalid regex gracefully', () => {
      profile.includeRegex = '[invalid';
      
      const filter = new CompiledGlobalFilter(profile);
      
      const task = createTask('Task', { type:  'daily', interval: 1 });
      
      // Invalid regex should be ignored (disabled)
      expect(filter.matches(task)).toBe(true);
    });
    
    it('should match against taskText target', () => {
      profile. excludeRegex = 'skip|ignore';
      profile.regexTargets = ['taskText'];
      
      const filter = new CompiledGlobalFilter(profile);
      
      const task1 = createTask('Please skip this task', { type: 'daily', interval: 1 });
      const task2 = createTask('Regular task', { type: 'daily', interval: 1 });
      
      expect(filter.matches(task1)).toBe(false);
      expect(filter.matches(task2)).toBe(true);
    });
    
    it('should match against path target', () => {
      profile.excludeRegex = 'archive';
      profile.regexTargets = ['path'];
      
      const filter = new CompiledGlobalFilter(profile);
      
      const task1 = createTask('archive task', { type: 'daily', interval: 1 });
      task1.path = 'daily/2024-01-01.md';
      
      const task2 = createTask('normal task', { type: 'daily', interval: 1 });
      task2.path = 'daily/archive/2024-01-01.md';
      
      // Should only check path, not task text
      expect(filter.matches(task1)).toBe(true); // "archive" in text, but not checked
      expect(filter.matches(task2)).toBe(false); // "archive" in path
    });
    
    it('should match against fileName target', () => {
      profile.excludeRegex = 'template';
      profile.regexTargets = ['fileName'];
      
      const filter = new CompiledGlobalFilter(profile);
      
      const task1 = createTask('Task', { type: 'daily', interval: 1 });
      task1.path = 'projects/template. md';
      
      const task2 = createTask('Task', { type: 'daily', interval: 1 });
      task2.path = 'projects/work. md';
      
      expect(filter.matches(task1)).toBe(false);
      expect(filter.matches(task2)).toBe(true);
    });
    
    it('should match against multiple targets', () => {
      profile.includeRegex = 'important';
      profile.regexTargets = ['taskText', 'path'];
      
      const filter = new CompiledGlobalFilter(profile);
      
      const task1 = createTask('important task', { type: 'daily', interval: 1 });
      task1.path = 'projects/work.md';
      
      const task2 = createTask('regular task', { type: 'daily', interval: 1 });
      task2.path = 'projects/important/work.md';
      
      const task3 = createTask('regular task', { type: 'daily', interval: 1 });
      task3.path = 'projects/work.md';
      
      expect(filter.matches(task1)).toBe(true); // "important" in text
      expect(filter.matches(task2)).toBe(true); // "important" in path
      expect(filter.matches(task3)).toBe(false); // "important" nowhere
    });
    
    it('should handle complex regex patterns', () => {
      profile.includeRegex = '^\\[.*\\]';
      profile.regexTargets = ['taskText'];
      
      const filter = new CompiledGlobalFilter(profile);
      
      const task1 = createTask('[High Priority] Task', { type: 'daily', interval: 1 });
      const task2 = createTask('Regular task', { type: 'daily', interval: 1 });
      
      expect(filter.matches(task1)).toBe(true);
      expect(filter.matches(task2)).toBe(false);
    });
  });
  
  describe('Precedence rules', () => {
    it('should evaluate in correct order (exclude before include)', () => {
      profile.includePaths = ['daily/**'];
      profile.excludePaths = ['daily/archive/**'];
      profile.includeTags = ['#task'];
      profile.excludeTags = ['#skip'];
      
      const filter = new CompiledGlobalFilter(profile);
      
      const task = createTask('Task', { type:  'daily', interval: 1 });
      task.path = 'daily/archive/2024-01-01.md';
      task.tags = ['#task'];
      
      // Should fail at excludePath (first check)
      const decision = filter.explain(task);
      expect(decision.included).toBe(false);
      expect(decision.matchedRule?.type).toBe('excludePath');
    });
    
    it('should check all exclude filters before include filters', () => {
      profile. includePaths = ['projects/**'];
      profile.includeTags = ['#work'];
      profile.excludeTags = ['#archive'];
      
      const filter = new CompiledGlobalFilter(profile);
      
      const task = createTask('Task', { type: 'daily', interval: 1 });
      task.path = 'projects/work. md';
      task.tags = ['#work', '#archive'];
      
      // Should fail at excludeTags even though path and includeTags match
      const decision = filter.explain(task);
      expect(decision.included).toBe(false);
      expect(decision.matchedRule?.type).toBe('excludeTag');
    });
    
    it('should pass all filters to be included', () => {
      profile. includePaths = ['projects/**'];
      profile.excludePaths = ['projects/archive/**'];
      profile.includeTags = ['#active'];
      profile.excludeTags = ['#skip'];
      profile.includeRegex = 'TODO';
      profile.excludeRegex = 'DRAFT';
      profile.regexTargets = ['taskText'];
      
      const filter = new CompiledGlobalFilter(profile);
      
      const task = createTask('TODO task', { type: 'daily', interval: 1 });
      task.path = 'projects/work/task.md';
      task. tags = ['#active'];
      
      expect(filter.matches(task)).toBe(true);
      
      const decision = filter.explain(task);
      expect(decision.included).toBe(true);
      expect(decision.reason).toBe('Passed all filters');
    });
  });
  
  describe('Edge cases', () => {
    it('should handle empty profile (allow all)', () => {
      const filter = new CompiledGlobalFilter(profile);
      
      const task = createTask('Task', { type: 'daily', interval: 1 });
      
      expect(filter.matches(task)).toBe(true);
    });
    
    it('should handle tasks with no metadata', () => {
      profile.includeTags = ['#task'];
      
      const filter = new CompiledGlobalFilter(profile);
      
      const task = createTask('Task', { type: 'daily', interval: 1 });
      // No path, no tags
      
      expect(filter.matches(task)).toBe(false);
    });
    
    it('should handle empty strings in paths', () => {
      profile.includePaths = ['projects/**'];
      
      const filter = new CompiledGlobalFilter(profile);
      
      const task = createTask('Task', { type: 'daily', interval:  1 });
      task.path = '';
      
      expect(filter.matches(task)).toBe(false);
    });
    
    it('should handle empty arrays in tags', () => {
      profile. includeTags = ['#work'];
      
      const filter = new CompiledGlobalFilter(profile);
      
      const task = createTask('Task', { type: 'daily', interval: 1 });
      task.tags = [];
      
      expect(filter.matches(task)).toBe(false);
    });
  });
  
  describe('Performance', () => {
    it('should handle 10k tasks efficiently', () => {
      profile.includePaths = ['projects/**'];
      profile.excludeTags = ['#archive'];
      profile.excludeRegex = 'SKIP';
      profile.regexTargets = ['taskText'];
      
      const filter = new CompiledGlobalFilter(profile);
      
      const tasks:  Task[] = [];
      for (let i = 0; i < 10000; i++) {
        const task = createTask(`Task ${i}`, { type: 'daily', interval: 1 });
        task.path = `projects/project${i % 100}/task. md`;
        task.tags = i % 10 === 0 ? ['#archive'] : ['#active'];
        tasks.push(task);
      }
      
      const start = performance.now();
      const filtered = tasks.filter(t => filter.matches(t));
      const end = performance.now();
      
      expect(end - start).toBeLessThan(100); // Should complete in < 100ms
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.length).toBeLessThan(tasks.length); // Some should be filtered
    });
    
    it('should compile patterns only once', () => {
      profile.includePaths = Array(100).fill('projects/**');
      profile.excludePaths = Array(100).fill('archive/**');
      
      const start = performance.now();
      const filter = new CompiledGlobalFilter(profile);
      const end = performance.now();
      
      expect(end - start).toBeLessThan(50); // Compilation should be fast
      
      const task = createTask('Task', { type: 'daily', interval: 1 });
      task.path = 'projects/work. md';
      
      expect(filter.matches(task)).toBe(true);
    });
  });
});

describe('GlobalFilter singleton', () => {
  let globalFilter: GlobalFilter;
  
  beforeEach(() => {
    globalFilter = GlobalFilter.getInstance();
    globalFilter.reset(); // Reset to defaults before each test
  });
  
  afterEach(() => {
    globalFilter.reset(); // Clean up after each test
  });
  
  it('should return the same instance', () => {
    const instance1 = GlobalFilter.getInstance();
    const instance2 = GlobalFilter.getInstance();
    
    expect(instance1).toBe(instance2);
  });
  
  it('should switch profiles correctly', () => {
    const config:  GlobalFilterConfig = {
      enabled: true,
      mode: 'all',
      activeProfileId: 'profile1',
      profiles: [
        {
          id: 'profile1',
          name: 'Profile 1',
          includePaths: [],
          excludePaths:  [],
          includeTags: ['#work'],
          excludeTags: [],
          regexTargets: ['taskText'],
          excludeStatusTypes: [],
        },
        {
          id: 'profile2',
          name: 'Profile 2',
          includePaths: [],
          excludePaths: [],
          includeTags:  ['#personal'],
          excludeTags: [],
          regexTargets: ['taskText'],
          excludeStatusTypes: [],
        },
      ],
    };
    
    globalFilter.updateConfig(config);
    
    const task1 = createTask('Task 1', { type: 'daily', interval: 1 });
    task1.tags = ['#work'];
    
    const task2 = createTask('Task 2', { type:  'daily', interval: 1 });
    task2.tags = ['#personal'];
    
    // Profile 1 active
    expect(globalFilter.shouldIncludeTask(task1)).toBe(true);
    expect(globalFilter.shouldIncludeTask(task2)).toBe(false);
    
    // Switch to Profile 2
    globalFilter.setActiveProfile('profile2');
    
    expect(globalFilter.shouldIncludeTask(task1)).toBe(false);
    expect(globalFilter.shouldIncludeTask(task2)).toBe(true);
  });
  
  it('should handle disabled filter', () => {
    const config:  GlobalFilterConfig = {
      enabled: false,
      mode: 'all',
      activeProfileId: 'default',
      profiles: [DEFAULT_PROFILE],
    };
    
    globalFilter.updateConfig(config);
    
    const task = createTask('Task', { type: 'daily', interval:  1 });
    
    expect(globalFilter.shouldIncludeTask(task)).toBe(true);
    expect(globalFilter.shouldTreatAsTask('- [ ] Task')).toBe(true);
  });
  
  it('should extract tags from raw content', () => {
    const config: GlobalFilterConfig = {
      enabled: true,
      mode:  'all',
      activeProfileId: 'default',
      profiles: [
        {
          ... DEFAULT_PROFILE,
          includeTags: ['#task'],
        },
      ],
    };
    
    globalFilter.updateConfig(config);
    
    expect(globalFilter.shouldTreatAsTask('- [ ] My task #task')).toBe(true);
    expect(globalFilter.shouldTreatAsTask('- [ ] My note #note')).toBe(false);
  });
  
  it('should provide explain mode', () => {
    const config: GlobalFilterConfig = {
      enabled: true,
      mode:  'all',
      activeProfileId: 'default',
      profiles: [
        {
          ...DEFAULT_PROFILE,
          excludeTags: ['#archive'],
        },
      ],
    };
    
    globalFilter.updateConfig(config);
    
    const task = createTask('Task', { type: 'daily', interval: 1 });
    task.tags = ['#archive'];
    
    const decision = globalFilter.explainTask(task);
    expect(decision.included).toBe(false);
    expect(decision. reason).toContain('Excluded by tag');
    expect(decision.matchedRule?.type).toBe('excludeTag');
    expect(decision.matchedRule?. pattern).toBe('#archive');
  });
  
  it('should return active profile', () => {
    const config:  GlobalFilterConfig = {
      enabled: true,
      mode: 'all',
      activeProfileId: 'custom',
      profiles: [
        {
          id: 'custom',
          name: 'Custom Profile',
          includePaths: [],
          excludePaths: [],
          includeTags: [],
          excludeTags: [],
          regexTargets: ['taskText'],
          excludeStatusTypes: [],
        },
      ],
    };
    
    globalFilter.updateConfig(config);
    
    const activeProfile = globalFilter.getActiveProfile();
    expect(activeProfile).toBeDefined();
    expect(activeProfile?. id).toBe('custom');
    expect(activeProfile?.name).toBe('Custom Profile');
  });
  
  it('should handle invalid profile switch gracefully', () => {
    const config: GlobalFilterConfig = {
      enabled: true,
      mode: 'all',
      activeProfileId: 'profile1',
      profiles: [
        {
          id: 'profile1',
          name: 'Profile 1',
          includePaths: [],
          excludePaths: [],
          includeTags: [],
          excludeTags: [],
          regexTargets: ['taskText'],
          excludeStatusTypes: [],
        },
      ],
    };
    
    globalFilter.updateConfig(config);
    
    // Try to switch to non-existent profile
    globalFilter.setActiveProfile('nonexistent');
    
    // Should still use profile1
    const activeProfile = globalFilter.getActiveProfile();
    expect(activeProfile?. id).toBe('profile1');
  });
});

describe('validateProfile', () => {
  it('should validate valid profile', () => {
    const profile: GlobalFilterProfile = {
      id: 'test',
      name: 'Test',
      includePaths: ['projects/**'],
      excludePaths:  ['archive/**'],
      includeTags: ['#work'],
      excludeTags: ['#skip'],
      includeRegex: 'TODO',
      excludeRegex: 'DRAFT',
      regexTargets: ['taskText'],
      excludeStatusTypes: [],
    };
    
    const result = validateProfile(profile);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
  
  it('should detect invalid includeRegex', () => {
    const profile: GlobalFilterProfile = {
      ... DEFAULT_PROFILE,
      includeRegex: '[invalid',
    };
    
    const result = validateProfile(profile);
    expect(result.valid).toBe(false);
    expect(result.errors. length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('includeRegex');
  });
  
  it('should detect invalid excludeRegex', () => {
    const profile: GlobalFilterProfile = {
      ...DEFAULT_PROFILE,
      excludeRegex: '(unclosed',
    };
    
    const result = validateProfile(profile);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('excludeRegex');
  });
  
  it('should detect tags without # prefix', () => {
    const profile: GlobalFilterProfile = {
      ...DEFAULT_PROFILE,
      includeTags: ['work', 'task'], // Missing #
    };
    
    const result = validateProfile(profile);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(2);
    expect(result.errors[0]).toContain('work');
    expect(result.errors[1]).toContain('task');
  });
  
  it('should allow valid tags with # prefix', () => {
    const profile: GlobalFilterProfile = {
      ...DEFAULT_PROFILE,
      includeTags: ['#work', '#task'],
      excludeTags: ['#archive'],
    };
    
    const result = validateProfile(profile);
    expect(result.valid).toBe(true);
  });
  
  it('should detect multiple validation errors', () => {
    const profile: GlobalFilterProfile = {
      ...DEFAULT_PROFILE,
      includeRegex: '[invalid',
      excludeRegex: '(unclosed',
      includeTags: ['work'], // Missing #
    };
    
    const result = validateProfile(profile);
    expect(result. valid).toBe(false);
    expect(result.errors.length).toBe(3);
  });
});

describe('Integration:  Filter with TaskStorage', () => {
  it('should filter tasks during loading', () => {
    const config: GlobalFilterConfig = {
      enabled: true,
      mode:  'all',
      activeProfileId: 'default',
      profiles: [
        {
          ...DEFAULT_PROFILE,
          excludeTags: ['#template'],
        },
      ],
    };
    
    const globalFilter = GlobalFilter.getInstance();
    globalFilter.updateConfig(config);
    
    const tasks: Task[] = [
      { ... createTask('Task 1', { type: 'daily', interval:  1 }), tags: ['#work'] },
      { ...createTask('Task 2', { type:  'daily', interval: 1 }), tags: ['#template'] },
      { ...createTask('Task 3', { type:  'daily', interval: 1 }), tags: ['#active'] },
    ];
    
    const filtered = tasks.filter(t => globalFilter. shouldIncludeTask(t));
    
    expect(filtered).toHaveLength(2);
    expect(filtered. find(t => t.name === 'Task 1')).toBeDefined();
    expect(filtered.find(t => t. name === 'Task 2')).toBeUndefined();
    expect(filtered.find(t => t. name === 'Task 3')).toBeDefined();
  });
});

describe('Real-world scenarios', () => {
  it('should handle "Work only" profile', () => {
    const workProfile: GlobalFilterProfile = {
      id: 'work',
      name: 'Work',
      includePaths: ['work/**', 'projects/**'],
      excludePaths: ['work/archive/**'],
      includeTags: ['#work'],
      excludeTags: ['#personal', '#template'],
      regexTargets: ['taskText'],
      excludeStatusTypes: [],
    };
    
    const filter = new CompiledGlobalFilter(workProfile);
    
    const task1 = createTask('Work task', { type: 'daily', interval: 1 });
    task1.path = 'work/active/task.md';
    task1.tags = ['#work'];
    
    const task2 = createTask('Personal task', { type: 'daily', interval:  1 });
    task2.path = 'personal/task.md';
    task2.tags = ['#personal'];
    
    const task3 = createTask('Archived work', { type: 'daily', interval: 1 });
    task3.path = 'work/archive/task.md';
    task3.tags = ['#work'];
    
    expect(filter.matches(task1)).toBe(true);
    expect(filter.matches(task2)).toBe(false);
    expect(filter.matches(task3)).toBe(false);
  });
  
  it('should handle "No daily notes" profile', () => {
    const noDailyProfile: GlobalFilterProfile = {
      id: 'no-daily',
      name:  'No Daily Notes',
      includePaths: [],
      excludePaths: ['daily/**', 'journal/**'],
      includeTags:  [],
      excludeTags: [],
      regexTargets: ['taskText'],
      excludeStatusTypes: [],
    };
    
    const filter = new CompiledGlobalFilter(noDailyProfile);
    
    const task1 = createTask('Project task', { type: 'daily', interval: 1 });
    task1.path = 'projects/task.md';
    
    const task2 = createTask('Daily note task', { type: 'daily', interval: 1 });
    task2.path = 'daily/2024-01-01.md';
    
    expect(filter.matches(task1)).toBe(true);
    expect(filter.matches(task2)).toBe(false);
  });
  
  it('should handle "Active tasks only" profile', () => {
    const activeProfile: GlobalFilterProfile = {
      id: 'active',
      name: 'Active Only',
      includePaths: [],
      excludePaths: [],
      includeTags: ['#active', '#todo', '#inprogress'],
      excludeTags: ['#done', '#archive', '#someday'],
      includeRegex: undefined,
      excludeRegex:  'SKIP|IGNORE|DRAFT',
      regexTargets: ['taskText'],
      excludeStatusTypes: [],
    };
    
    const filter = new CompiledGlobalFilter(activeProfile);
    
    const task1 = createTask('Active task', { type: 'daily', interval: 1 });
    task1.tags = ['#active'];
    
    const task2 = createTask('SKIP this task', { type: 'daily', interval: 1 });
    task2.tags = ['#active'];
    
    const task3 = createTask('Done task', { type: 'daily', interval: 1 });
    task3.tags = ['#done'];
    
    expect(filter.matches(task1)).toBe(true);
    expect(filter.matches(task2)).toBe(false); // Excluded by regex
    expect(filter.matches(task3)).toBe(false); // Excluded by tag
  });
});
