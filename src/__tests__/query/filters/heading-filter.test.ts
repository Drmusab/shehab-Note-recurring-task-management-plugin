import { describe, it, expect } from 'vitest';
import { HeadingFilter } from '@/core/query/filters/HeadingFilter';
import { createTask } from '@/core/models/Task';
import type { Task } from '@/core/models/Task';

describe('HeadingFilter', () => {
  const createTaskWithHeading = (heading: string): Task => {
    const task = createTask('Test Task', { type: 'daily', interval: 1 });
    task.heading = heading;
    return task;
  };

  describe('includes operator', () => {
    it('should match when heading contains pattern', () => {
      const filter = new HeadingFilter('includes', 'Work');
      const task = createTaskWithHeading('Work Projects');
      
      expect(filter.matches(task)).toBe(true);
    });

    it('should be case-insensitive', () => {
      const filter = new HeadingFilter('includes', 'work');
      const task = createTaskWithHeading('Work Projects');
      
      expect(filter.matches(task)).toBe(true);
    });

    it('should not match when heading does not contain pattern', () => {
      const filter = new HeadingFilter('includes', 'Personal');
      const task = createTaskWithHeading('Work Projects');
      
      expect(filter.matches(task)).toBe(false);
    });

    it('should handle tasks without heading', () => {
      const filter = new HeadingFilter('includes', 'Work');
      const task = createTask('Test Task', { type: 'daily', interval: 1 });
      
      expect(filter.matches(task)).toBe(false);
    });

    it('should match empty pattern when heading is empty', () => {
      const filter = new HeadingFilter('includes', '');
      const task = createTask('Test Task', { type: 'daily', interval: 1 });
      
      expect(filter.matches(task)).toBe(true);
    });
  });

  describe('does not include operator', () => {
    it('should match when heading does not contain pattern', () => {
      const filter = new HeadingFilter('does not include', 'Personal');
      const task = createTaskWithHeading('Work Projects');
      
      expect(filter.matches(task)).toBe(true);
    });

    it('should not match when heading contains pattern', () => {
      const filter = new HeadingFilter('does not include', 'Work');
      const task = createTaskWithHeading('Work Projects');
      
      expect(filter.matches(task)).toBe(false);
    });

    it('should be case-insensitive', () => {
      const filter = new HeadingFilter('does not include', 'work');
      const task = createTaskWithHeading('Work Projects');
      
      expect(filter.matches(task)).toBe(false);
    });

    it('should match tasks without heading when pattern is not empty', () => {
      const filter = new HeadingFilter('does not include', 'Work');
      const task = createTask('Test Task', { type: 'daily', interval: 1 });
      
      expect(filter.matches(task)).toBe(true);
    });
  });

  describe('partial matches', () => {
    it('should match partial heading text', () => {
      const filter = new HeadingFilter('includes', 'Project');
      const task = createTaskWithHeading('Work Projects / Q1 2024');
      
      expect(filter.matches(task)).toBe(true);
    });

    it('should match with special characters', () => {
      const filter = new HeadingFilter('includes', 'Q1');
      const task = createTaskWithHeading('Work Projects / Q1 2024');
      
      expect(filter.matches(task)).toBe(true);
    });
  });
});
