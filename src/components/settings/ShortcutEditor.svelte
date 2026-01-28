<script lang="ts">
  import { keyboardShortcutsStore, DEFAULT_SHORTCUTS, type Shortcut } from '@/stores/keyboardShortcutsStore';
  import ShortcutRecorder from './ShortcutRecorder.svelte';
  import { formatKeyCombo } from '@/utils/keyboardHandler';
  
  let shortcuts: Record<string, Shortcut> = {};
  let filterCategory: string = 'all';
  let conflictMessages: Record<string, string> = {};
  
  // Subscribe to shortcuts store
  $: shortcuts = $keyboardShortcutsStore;
  
  // Group shortcuts by category
  $: categorizedShortcuts = Object.values(shortcuts).reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);
  
  // Filter shortcuts by category
  $: filteredCategories = filterCategory === 'all' 
    ? categorizedShortcuts 
    : { [filterCategory]: categorizedShortcuts[filterCategory] || [] };
  
  function handleRecorded(shortcutId: string, keys: string[]) {
    const result = keyboardShortcutsStore.updateShortcut(shortcutId, keys);
    if (result.error) {
      conflictMessages[shortcutId] = result.error;
      // Clear conflict message after 3 seconds
      setTimeout(() => {
        conflictMessages = { ...conflictMessages, [shortcutId]: '' };
      }, 3000);
    } else {
      conflictMessages[shortcutId] = '';
    }
  }
  
  function handleReset(shortcutId: string) {
    keyboardShortcutsStore.resetShortcut(shortcutId);
    conflictMessages[shortcutId] = '';
  }
  
  function handleResetAll() {
    if (confirm('Reset all keyboard shortcuts to defaults?')) {
      keyboardShortcutsStore.resetAll();
      conflictMessages = {};
    }
  }
  
  function getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      navigation: 'Navigation',
      editing: 'Editing',
      bulk: 'Bulk Actions',
      global: 'Global'
    };
    return labels[category] || category;
  }
</script>

<div class="shortcut-editor">
  <div class="editor-header">
    <h3>Keyboard Shortcuts</h3>
    <div class="header-actions">
      <select bind:value={filterCategory} class="category-filter">
        <option value="all">All Categories</option>
        <option value="navigation">Navigation</option>
        <option value="editing">Editing</option>
        <option value="bulk">Bulk Actions</option>
        <option value="global">Global</option>
      </select>
      <button on:click={handleResetAll} class="reset-all-btn">
        Reset All
      </button>
    </div>
  </div>
  
  <div class="shortcuts-list">
    {#each Object.entries(filteredCategories) as [category, categoryShortcuts]}
      <div class="category-section">
        <h4 class="category-title">{getCategoryLabel(category)}</h4>
        <div class="category-shortcuts">
          {#each categoryShortcuts as shortcut}
            <div class="shortcut-row">
              <div class="shortcut-info">
                <span class="shortcut-label">{shortcut.label}</span>
                <span class="shortcut-action">{shortcut.action}</span>
              </div>
              <div class="shortcut-controls">
                <ShortcutRecorder
                  currentKeys={shortcut.keys}
                  conflictMessage={conflictMessages[shortcut.id] || ''}
                  on:recorded={(e) => handleRecorded(shortcut.id, e.detail)}
                />
                <button
                  on:click={() => handleReset(shortcut.id)}
                  class="reset-btn"
                  title="Reset to default"
                  disabled={JSON.stringify(shortcut.keys) === JSON.stringify(DEFAULT_SHORTCUTS[shortcut.id]?.default)}
                >
                  Reset
                </button>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .shortcut-editor {
    padding: 1rem;
    max-width: 800px;
  }
  
  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid var(--background-modifier-border);
  }
  
  .editor-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
  }
  
  .header-actions {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }
  
  .category-filter {
    padding: 0.4rem 0.75rem;
    border: 1px solid var(--background-modifier-border);
    border-radius: 4px;
    background: var(--background-primary);
    color: var(--text-normal);
    font-size: 0.9rem;
    cursor: pointer;
  }
  
  .category-filter:focus {
    outline: 2px solid var(--interactive-accent);
    outline-offset: -2px;
  }
  
  .reset-all-btn {
    padding: 0.4rem 0.75rem;
    border: 1px solid var(--background-modifier-border);
    border-radius: 4px;
    background: var(--interactive-normal);
    color: var(--text-normal);
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .reset-all-btn:hover {
    background: var(--interactive-hover);
    border-color: var(--text-error);
    color: var(--text-error);
  }
  
  .shortcuts-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .category-section {
    background: var(--background-secondary);
    border-radius: 6px;
    padding: 1rem;
  }
  
  .category-title {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-normal);
  }
  
  .category-shortcuts {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .shortcut-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 4px;
    transition: border-color 0.15s ease;
  }
  
  .shortcut-row:hover {
    border-color: var(--interactive-accent);
  }
  
  .shortcut-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .shortcut-label {
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--text-normal);
  }
  
  .shortcut-action {
    font-size: 0.8rem;
    color: var(--text-muted);
    font-family: monospace;
  }
  
  .shortcut-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .reset-btn {
    padding: 0.35rem 0.75rem;
    border: 1px solid var(--background-modifier-border);
    border-radius: 3px;
    background: var(--interactive-normal);
    color: var(--text-normal);
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .reset-btn:hover:not(:disabled) {
    background: var(--interactive-hover);
    border-color: var(--interactive-accent);
  }
  
  .reset-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .reset-btn:focus {
    outline: 2px solid var(--interactive-accent);
    outline-offset: 2px;
  }
</style>
