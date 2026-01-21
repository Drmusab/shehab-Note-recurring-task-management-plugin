/**
 * Slash commands and keyboard shortcuts for SiYuan
 */

import type { Plugin } from "siyuan";
import type { TaskRepositoryProvider } from "@/core/storage/TaskRepository";
import type { RecurrenceEngine } from "@/core/engine/RecurrenceEngine";
import type { PluginSettings } from "@/core/settings/PluginSettings";
import { ShortcutManager, type ShortcutHandlers } from "@/commands/ShortcutManager";

/**
 * Register slash commands and keyboard shortcuts.
 */
export async function registerCommands(
  plugin: Plugin,
  repository: TaskRepositoryProvider,
  handlers: ShortcutHandlers,
  recurrenceEngine?: RecurrenceEngine,
  getSettings?: () => PluginSettings
): Promise<ShortcutManager> {
  const shortcutManager = new ShortcutManager(
    plugin,
    repository,
    recurrenceEngine,
    getSettings,
    handlers
  );
  await shortcutManager.initialize();
  shortcutManager.registerShortcuts();
  return shortcutManager;
}
