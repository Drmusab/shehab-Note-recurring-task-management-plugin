import { describe, it, expect, beforeEach } from 'vitest';
import { QueryParser } from '@/core/query/QueryParser';
import { QueryEngine, type TaskIndex } from '@/core/query/QueryEngine';
import { createTask } from '@/core/models/Task';
import type { Task } from '@/core/models/Task';

describe('HeadingFilter Integration', () => {
  let parser: QueryParser;
  let tasks: Task[];
  let taskIndex: TaskIndex;
  let engine: QueryEngine;

  beforeEach(() => {
    parser = new QueryParser();
    tasks = [];
    taskIndex = {
      getAllTasks: () => tasks,
    };
    engine = new QueryEngine(taskIndex);
  });

  describe('QueryParser', () => {
    it('should parse "heading includes" syntax', () => {
      const ast = parser.parse('heading includes Work');
      
      expect(ast.filters).toHaveLength(1);
      expect(ast.filters[0].type).toBe('heading');
      expect(ast.filters[0].operator).toBe('includes');
      expect(ast.filters[0].value).toBe('Work');
    });

    it('should parse "heading does not include" syntax', () => {
      const ast = parser.parse('heading does not include Personal');
      
      expect(ast.filters).toHaveLength(1);
      expect(ast.filters[0].type).toBe('heading');
      expect(ast.filters[0].operator).toBe('does not include');
      expect(ast.filters[0].value).toBe('Personal');
    });

    it('should parse quoted heading patterns', () => {
      const ast = parser.parse('heading includes "Work Projects"');
      
      expect(ast.filters[0].value).toBe('Work Projects');
    });

    it('should handle heading filter with other filters', () => {
      const ast = parser.parse('heading includes Work\nstatus.type is TODO');
      
      expect(ast.filters).toHaveLength(2);
      expect(ast.filters[0].type).toBe('heading');
      expect(ast.filters[1].type).toBe('status');
    });
  });

  describe('QueryEngine execution', () => {
    beforeEach(() => {
      const task1 = createTask('Review code', { type: 'daily', interval: 1 });
      task1.heading = 'Work Projects';
      
      const task2 = createTask('Buy groceries', { type: 'daily', interval: 1 });
      task2.heading = 'Personal Tasks';
      
      const task3 = createTask('Write report', { type: 'daily', interval: 1 });
      task3.heading = 'Work / Q1 Planning';
      
      const task4 = createTask('Call mom', { type: 'daily', interval: 1 });
      // No heading for this task
      
      tasks = [task1, task2, task3, task4];
    });

    it('should filter tasks by heading includes', () => {
      const result = engine.executeString('heading includes Work');
      
      expect(result.tasks).toHaveLength(2);
      expect(result.tasks[0].name).toBe('Review code');
      expect(result.tasks[1].name).toBe('Write report');
    });

    it('should filter tasks by heading does not include', () => {
      const result = engine.executeString('heading does not include Work');
      
      expect(result.tasks).toHaveLength(2);
      expect(result.tasks[0].name).toBe('Buy groceries');
      expect(result.tasks[1].name).toBe('Call mom');
    });

    it('should handle partial matches', () => {
      const result = engine.executeString('heading includes Q1');
      
      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].name).toBe('Write report');
    });

    it('should be case-insensitive', () => {
      const result = engine.executeString('heading includes work');
      
      expect(result.tasks).toHaveLength(2);
    });

    it('should work with combined filters', () => {
      // Add statusSymbol to tasks (space = TODO, x = DONE)
      tasks[0].statusSymbol = ' '; // TODO
      tasks[1].statusSymbol = ' '; // TODO
      tasks[2].statusSymbol = 'x'; // DONE
      tasks[3].statusSymbol = ' '; // TODO
      
      const result = engine.executeString('heading includes Work\nstatus.type is TODO');
      
      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].name).toBe('Review code');
    });

    it('should work with boolean operators', () => {
      const result = engine.executeString('heading includes Work OR heading includes Personal');
      
      expect(result.tasks).toHaveLength(3);
    });
  });

  describe('Sorting by heading', () => {
    beforeEach(() => {
      const task1 = createTask('Task 1', { type: 'daily', interval: 1 });
      task1.heading = 'Zebra';
      
      const task2 = createTask('Task 2', { type: 'daily', interval: 1 });
      task2.heading = 'Apple';
      
      const task3 = createTask('Task 3', { type: 'daily', interval: 1 });
      task3.heading = 'Banana';
      
      tasks = [task1, task2, task3];
    });

    it('should sort tasks by heading', () => {
      const result = engine.executeString('sort by heading');
      
      expect(result.tasks).toHaveLength(3);
      expect(result.tasks[0].heading).toBe('Apple');
      expect(result.tasks[1].heading).toBe('Banana');
      expect(result.tasks[2].heading).toBe('Zebra');
    });

    it('should sort tasks by heading in reverse', () => {
      const result = engine.executeString('sort by heading reverse');
      
      expect(result.tasks).toHaveLength(3);
      expect(result.tasks[0].heading).toBe('Zebra');
      expect(result.tasks[1].heading).toBe('Banana');
      expect(result.tasks[2].heading).toBe('Apple');
    });
  });
});
