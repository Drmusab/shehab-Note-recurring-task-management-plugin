/**
 * Keyboard Shortcuts Store
 * Manages custom keyboard shortcuts and their actions
 */

import { writable, get } from 'svelte/store';

export interface Shortcut {
  id: string;
  category: string;
  label: string;
  keys: string[];
  action: string;
  default: string[];
}

export interface ShortcutAction {
  (event?: KeyboardEvent): void | Promise<void>;
}

export type ShortcutCategory = 'navigation' | 'editing' | 'bulk' | 'global';

// Default shortcuts configuration
export const DEFAULT_SHORTCUTS: Record<string, Shortcut> = {
  // Navigation
  'navigate.next': {
    id: 'navigate.next',
    category: 'navigation',
    label: 'Next Task',
    keys: ['ArrowDown'],
    action: 'selectNextTask',
    default: ['ArrowDown']
  },
  'navigate.prev': {
    id: 'navigate.prev',
    category: 'navigation',
    label: 'Previous Task',
    keys: ['ArrowUp'],
    action: 'selectPreviousTask',
    default: ['ArrowUp']
  },
  'navigate.open': {
    id: 'navigate.open',
    category: 'navigation',
    label: 'Open Task',
    keys: ['Enter'],
    action: 'openSelectedTask',
    default: ['Enter']
  },
  'navigate.close': {
    id: 'navigate.close',
    category: 'navigation',
    label: 'Close Editor',
    keys: ['Escape'],
    action: 'closeEditor',
    default: ['Escape']
  },
  
  // Editing
  'edit.new': {
    id: 'edit.new',
    category: 'editing',
    label: 'New Task',
    keys: ['Ctrl', 'n'],
    action: 'createNewTask',
    default: ['Ctrl', 'n']
  },
  'edit.complete': {
    id: 'edit.complete',
    category: 'editing',
    label: 'Complete Task',
    keys: ['Ctrl', 'Enter'],
    action: 'completeTask',
    default: ['Ctrl', 'Enter']
  },
  'edit.delete': {
    id: 'edit.delete',
    category: 'editing',
    label: 'Delete Task',
    keys: ['Delete'],
    action: 'deleteTask',
    default: ['Delete']
  },
  
  // Bulk
  'bulk.toggle': {
    id: 'bulk.toggle',
    category: 'bulk',
    label: 'Toggle Bulk Mode',
    keys: ['Ctrl', 'b'],
    action: 'toggleBulkMode',
    default: ['Ctrl', 'b']
  },
  'bulk.selectAll': {
    id: 'bulk.selectAll',
    category: 'bulk',
    label: 'Select All Tasks',
    keys: ['Ctrl', 'a'],
    action: 'selectAllTasks',
    default: ['Ctrl', 'a']
  },
  
  // Global
  'global.search': {
    id: 'global.search',
    category: 'global',
    label: 'Focus Search',
    keys: ['Ctrl', 'k'],
    action: 'focusSearch',
    default: ['Ctrl', 'k']
  },
  'global.help': {
    id: 'global.help',
    category: 'global',
    label: 'Show Keyboard Help',
    keys: ['?'],
    action: 'showKeyboardHelp',
    default: ['?']
  }
};

const STORAGE_KEY = 'keyboard-shortcuts';

/**
 * Load shortcuts from localStorage
 */
function loadShortcuts(): Record<string, Shortcut> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure new shortcuts are included
      return { ...DEFAULT_SHORTCUTS, ...parsed };
    }
  } catch (error) {
    console.warn('Failed to load keyboard shortcuts:', error);
  }
  return { ...DEFAULT_SHORTCUTS };
}

/**
 * Save shortcuts to localStorage
 */
function saveShortcuts(shortcuts: Record<string, Shortcut>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
  } catch (error) {
    console.warn('Failed to save keyboard shortcuts:', error);
  }
}

/**
 * Normalize key name for comparison
 */
function normalizeKey(key: string): string {
  const keyMap: Record<string, string> = {
    'Control': 'Ctrl',
    'Meta': 'Cmd',
    'Command': 'Cmd'
  };
  return keyMap[key] || key;
}

/**
 * Check if two key combinations match
 */
function keysMatch(keys1: string[], keys2: string[]): boolean {
  if (keys1.length !== keys2.length) return false;
  
  const normalized1 = keys1.map(normalizeKey).sort();
  const normalized2 = keys2.map(normalizeKey).sort();
  
  return normalized1.every((key, i) => key === normalized2[i]);
}

function createKeyboardShortcutsStore() {
  const shortcuts = writable<Record<string, Shortcut>>(loadShortcuts());
  const actions = new Map<string, ShortcutAction>();
  
  /**
   * Register an action handler
   */
  function registerAction(actionName: string, handler: ShortcutAction): void {
    actions.set(actionName, handler);
  }
  
  /**
   * Unregister an action handler
   */
  function unregisterAction(actionName: string): void {
    actions.delete(actionName);
  }
  
  /**
   * Execute an action by name
   */
  function executeAction(actionName: string, event?: KeyboardEvent): void {
    const handler = actions.get(actionName);
    if (handler) {
      handler(event);
    }
  }
  
  /**
   * Find a shortcut by pressed keys
   */
  function findShortcut(pressedKeys: string[]): Shortcut | null {
    const currentShortcuts = get(shortcuts);
    
    for (const shortcut of Object.values(currentShortcuts)) {
      if (keysMatch(shortcut.keys, pressedKeys)) {
        return shortcut;
      }
    }
    
    return null;
  }
  
  /**
   * Find a conflicting shortcut
   */
  function findConflict(keys: string[], excludeId?: string): Shortcut | null {
    const currentShortcuts = get(shortcuts);
    
    for (const shortcut of Object.values(currentShortcuts)) {
      if (shortcut.id !== excludeId && keysMatch(shortcut.keys, keys)) {
        return shortcut;
      }
    }
    
    return null;
  }
  
  /**
   * Handle keyboard event
   */
  function handleKeydown(e: KeyboardEvent): void {
    // Ignore if typing in input/textarea
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }
    
    // Build pressed keys array
    const pressedKeys: string[] = [];
    
    if (e.ctrlKey) pressedKeys.push('Ctrl');
    if (e.shiftKey) pressedKeys.push('Shift');
    if (e.altKey) pressedKeys.push('Alt');
    if (e.metaKey) pressedKeys.push('Cmd');
    
    // Add the actual key if it's not a modifier
    if (e.key && !['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
      pressedKeys.push(e.key);
    }
    
    const shortcut = findShortcut(pressedKeys);
    if (shortcut) {
      e.preventDefault();
      executeAction(shortcut.action, e);
    }
  }
  
  /**
   * Update a shortcut's keys
   */
  function updateShortcut(id: string, newKeys: string[]): { success?: boolean; error?: string } {
    const conflict = findConflict(newKeys, id);
    if (conflict) {
      return { error: `Conflicts with "${conflict.label}"` };
    }
    
    shortcuts.update(s => {
      const updated = { ...s };
      if (updated[id]) {
        updated[id] = { ...updated[id], keys: newKeys };
      }
      saveShortcuts(updated);
      return updated;
    });
    
    return { success: true };
  }
  
  /**
   * Reset a shortcut to default
   */
  function resetShortcut(id: string): void {
    shortcuts.update(s => {
      const updated = { ...s };
      if (updated[id] && DEFAULT_SHORTCUTS[id]) {
        updated[id] = { ...updated[id], keys: [...DEFAULT_SHORTCUTS[id].default] };
      }
      saveShortcuts(updated);
      return updated;
    });
  }
  
  /**
   * Reset all shortcuts to defaults
   */
  function resetAll(): void {
    const defaultCopy = JSON.parse(JSON.stringify(DEFAULT_SHORTCUTS));
    shortcuts.set(defaultCopy);
    saveShortcuts(defaultCopy);
  }
  
  return {
    subscribe: shortcuts.subscribe,
    registerAction,
    unregisterAction,
    handleKeydown,
    updateShortcut,
    resetShortcut,
    resetAll,
    findConflict
  };
}

export const keyboardShortcutsStore = createKeyboardShortcutsStore();
