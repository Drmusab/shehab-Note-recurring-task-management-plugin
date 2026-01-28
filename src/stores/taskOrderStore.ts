/**
 * Task Order Store
 * Manages task ordering for drag-and-drop functionality
 */

import { writable } from 'svelte/store';
import type { Task } from '@/core/models/Task';

/**
 * Reorder tasks based on drag-and-drop result
 * Updates the order field for each task
 */
export function reorderTasks(tasks: Task[]): Task[] {
  return tasks.map((task, index) => ({
    ...task,
    order: index
  }));
}

/**
 * Sort tasks by their order field
 */
export function sortTasksByOrder(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
    return orderA - orderB;
  });
}

/**
 * Initialize order for tasks that don't have it
 */
export function initializeTaskOrder(tasks: Task[]): Task[] {
  return tasks.map((task, index) => ({
    ...task,
    order: task.order ?? index
  }));
}

/**
 * Store for tracking if drag mode is enabled
 */
export const dragModeEnabled = writable<boolean>(false);
