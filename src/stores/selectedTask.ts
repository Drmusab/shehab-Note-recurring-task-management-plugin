/**
 * Centralized store for split-view task selection
 * 
 * Manages the currently selected task in the split-view dashboard.
 * Provides a single source of truth for task selection state,
 * decoupling TaskListPane from TaskEditorPane.
 */

import { writable, get } from 'svelte/store';
import type { Task } from '@/vendor/obsidian-tasks/types/Task';

/**
 * Writable store for the currently selected task
 * null indicates no task is selected
 */
export const selectedTaskStore = writable<Task | null>(null);

/**
 * Select a task for editing
 * @param task The task to select
 */
export function selectTask(task: Task): void {
    selectedTaskStore.set(task);
}

/**
 * Clear the current task selection
 */
export function clearSelection(): void {
    selectedTaskStore.set(null);
}

/**
 * Check if a specific task is currently selected
 * @param task The task to check
 * @returns true if the task is selected
 */
export function isTaskSelected(task: Task): boolean {
    const selectedTask = get(selectedTaskStore);
    return selectedTask?.id === task.id;
}
