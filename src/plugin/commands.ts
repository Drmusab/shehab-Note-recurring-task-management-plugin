/**
 * Slash commands and keyboard shortcuts for SiYuan
 */

import type { Plugin } from "siyuan";
import type { TaskRepositoryProvider } from "@/core/storage/TaskRepository";
import { createTask } from "@/core/models/Task";
import { pluginEventBus } from "@/core/events/PluginEventBus";
import * as logger from "@/utils/logger";

/**
 * Register slash commands and keyboard shortcuts
 */
export function registerCommands(plugin: Plugin, repository: TaskRepositoryProvider): void {
  // Slash command: /task or /recurring - Create recurring task from selection
  plugin.addCommand({
    langKey: "createRecurringTask",
    hotkey: "⌘⇧R",
    callback: () => {
      dispatchCreateTaskEvent();
    },
  });

  // Hotkey: ⌘⇧T - Open Recurring Tasks dock
  plugin.addCommand({
    langKey: "openRecurringTasksDock",
    hotkey: "⌘⇧T",
    callback: () => {
      // Open the dock
      plugin.openDock();
    },
  });

  // Hotkey: ⌘⇧D - Quick complete next due task
  plugin.addCommand({
    langKey: "quickCompleteNextTask",
    hotkey: "⌘⇧D",
    callback: async () => {
      await quickCompleteNextTask(repository);
    },
  });

  logger.info("Registered slash commands and hotkeys");
}

/**
 * Dispatch event to open task creation dialog
 */
function dispatchCreateTaskEvent(): void {
  // Use pluginEventBus for internal communication
  pluginEventBus.emit('task:create', {
    source: 'command',
  });
  
  // Also dispatch window event for backward compatibility
  const event = new CustomEvent("recurring-task-create", {
    detail: {
      source: "command",
    },
  });
  window.dispatchEvent(event);
}

/**
 * Quick complete the next due task
 */
async function quickCompleteNextTask(repository: TaskRepositoryProvider): Promise<void> {
  try {
    const tasks = repository.getTodayAndOverdueTasks();
    if (tasks.length === 0) {
      logger.info("No tasks due today");
      return;
    }

    // Get the most overdue task
    const task = tasks[0];
    
    // Use pluginEventBus for internal communication
    pluginEventBus.emit('task:complete', {
      taskId: task.id,
    });
    
    // Also dispatch window event for backward compatibility
    const event = new CustomEvent("recurring-task-complete", {
      detail: {
        taskId: task.id,
      },
    });
    window.dispatchEvent(event);
    
    logger.info(`Quick completing task: ${task.name}`);
  } catch (err) {
    logger.error("Failed to quick complete task", err);
  }
}
