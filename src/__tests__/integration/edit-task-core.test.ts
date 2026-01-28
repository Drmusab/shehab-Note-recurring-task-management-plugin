/**
 * Phase 1 Integration Tests
 * Tests for EditTaskCore refactoring
 */

import { describe, it, expect } from 'vitest';
import { MODE_CONFIGS } from '@/types/EditTaskMode';
import { selectedTaskStore, selectTask, clearSelection } from '@/stores/selectedTask';
import { get } from 'svelte/store';

describe('Phase 1: EditTaskCore Extraction', () => {
  describe('EditTaskMode Types', () => {
    it('should have correct mode configurations', () => {
      expect(MODE_CONFIGS.modal).toBeDefined();
      expect(MODE_CONFIGS.embedded).toBeDefined();
    });

    it('should configure modal mode correctly', () => {
      const modalConfig = MODE_CONFIGS.modal;
      expect(modalConfig.showActionButtons).toBe(true);
      expect(modalConfig.enableAutoSave).toBe(false);
      expect(modalConfig.autoFocus).toBe(true);
      expect(modalConfig.showUnsavedIndicator).toBe(false);
    });

    it('should configure embedded mode correctly', () => {
      const embeddedConfig = MODE_CONFIGS.embedded;
      expect(embeddedConfig.showActionButtons).toBe(false);
      expect(embeddedConfig.enableAutoSave).toBe(true);
      expect(embeddedConfig.autoSaveDelayMs).toBe(500);
      expect(embeddedConfig.autoFocus).toBe(false);
      expect(embeddedConfig.showUnsavedIndicator).toBe(true);
    });
  });

  describe('selectedTask Store', () => {
    it('should initialize with null', () => {
      clearSelection();
      const value = get(selectedTaskStore);
      expect(value).toBeNull();
    });

    it('should store selected task', () => {
      const mockTask = {
        id: 'test-123',
        description: 'Test task',
        status: 'todo' as const,
        priority: 0,
      } as any;

      selectTask(mockTask);
      const value = get(selectedTaskStore);
      expect(value).toBeDefined();
      expect(value?.id).toBe('test-123');
    });

    it('should clear selection', () => {
      const mockTask = {
        id: 'test-456',
        description: 'Another test',
        status: 'todo' as const,
        priority: 0,
      } as any;

      selectTask(mockTask);
      expect(get(selectedTaskStore)).toBeDefined();

      clearSelection();
      expect(get(selectedTaskStore)).toBeNull();
    });
  });

  describe('Component Imports', () => {
    it('should be able to import EditTaskCore', async () => {
      const module = await import('@/ui/EditTaskCore.svelte');
      expect(module).toBeDefined();
      expect(module.default).toBeDefined();
    });

    it('should be able to import EditTaskModalWrapper', async () => {
      const module = await import('@/ui/EditTaskModalWrapper');
      expect(module).toBeDefined();
      expect(module.EditTaskModal).toBeDefined();
      expect(module.openEditTaskModal).toBeDefined();
    });

    it('should be able to import updated EditTask wrapper', async () => {
      const module = await import('@/vendor/obsidian-tasks/ui/EditTask.svelte');
      expect(module).toBeDefined();
      expect(module.default).toBeDefined();
    });
  });
});
