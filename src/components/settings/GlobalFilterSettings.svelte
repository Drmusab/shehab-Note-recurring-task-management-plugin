<script lang="ts">
  import { GlobalFilter } from '@/core/filtering/GlobalFilter';
  import { createFilterRule, validateFilterRule, type FilterRule, type GlobalFilterConfig, type FilterRuleType } from '@/core/filtering/FilterRule';
  import { toast } from '@/utils/notifications';

  let globalFilter = GlobalFilter.getInstance();
  let config = $state<GlobalFilterConfig>(globalFilter.getConfig());
  
  let newRuleType = $state<FilterRuleType>('tag');
  let newRulePattern = $state('');
  let newRuleDescription = $state('');

  function addRule() {
    if (!newRulePattern.trim()) {
      toast.error('Pattern cannot be empty');
      return;
    }

    const rule = createFilterRule(newRuleType, newRulePattern.trim(), newRuleDescription.trim());
    const validation = validateFilterRule(rule);
    
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid rule');
      return;
    }

    config.rules.push(rule);
    saveConfig();
    
    // Reset form
    newRulePattern = '';
    newRuleDescription = '';
    
    toast.success('Filter rule added');
  }

  function deleteRule(id: string) {
    config.rules = config.rules.filter(r => r.id !== id);
    saveConfig();
    toast.success('Filter rule deleted');
  }

  function toggleRule(id: string) {
    const rule = config.rules.find(r => r.id === id);
    if (rule) {
      rule.enabled = !rule.enabled;
      saveConfig();
    }
  }

  function saveConfig() {
    globalFilter.updateConfig(config);
  }

  function handleModeChange() {
    saveConfig();
  }

  function handleEnabledChange() {
    saveConfig();
  }
</script>

<div class="global-filter-settings">
  <h3 class="settings__section-title">Global Task Filter</h3>
  <p class="description">
    Control which checkboxes are treated as tasks
  </p>

  <div class="form-field">
    <label class="settings__toggle">
      <input type="checkbox" bind:checked={config.enabled} onchange={handleEnabledChange} />
      <span>Enable Global Filter</span>
    </label>
  </div>

  <div class="form-field">
    <label class="settings__label">Filter Mode</label>
    <select bind:value={config.mode} onchange={handleModeChange} class="settings__input">
      <option value="all">All checkboxes are tasks (default)</option>
      <option value="include">Only checkboxes matching rules</option>
      <option value="exclude">All except checkboxes matching rules</option>
    </select>
    <p class="hint">
      {#if config.mode === 'all'}
        All checkboxes will be treated as tasks (no filtering)
      {:else if config.mode === 'include'}
        Only checkboxes matching at least one rule will be treated as tasks
      {:else if config.mode === 'exclude'}
        Checkboxes matching any rule will be ignored
      {/if}
    </p>
  </div>

  <div class="rules-section">
    <h4 class="subsection-title">Filter Rules</h4>
    {#if config.rules.length === 0}
      <p class="empty-state">No filter rules configured</p>
    {:else}
      <div class="rules-list">
        {#each config.rules as rule}
          <div class="rule-item">
            <input 
              type="checkbox" 
              checked={rule.enabled} 
              onchange={() => toggleRule(rule.id)}
              class="rule-checkbox"
            />
            <div class="rule-info">
              <span class="rule-type">{rule.type}</span>
              <code class="rule-pattern">{rule.pattern}</code>
              {#if rule.description}
                <span class="rule-description">{rule.description}</span>
              {/if}
            </div>
            <button class="delete-btn" onclick={() => deleteRule(rule.id)}>Delete</button>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <div class="add-rule-section">
    <h4 class="subsection-title">Add Rule</h4>
    <div class="add-rule-form">
      <select bind:value={newRuleType} class="settings__input">
        <option value="tag">Tag (e.g., #task)</option>
        <option value="regex">Regex pattern</option>
        <option value="path">Document path (e.g., daily/)</option>
        <option value="marker">Text marker (e.g., TODO:)</option>
      </select>
      <input 
        type="text" 
        bind:value={newRulePattern} 
        placeholder="Pattern"
        class="settings__input"
      />
      <input 
        type="text" 
        bind:value={newRuleDescription} 
        placeholder="Description (optional)"
        class="settings__input"
      />
      <button onclick={addRule} class="add-btn">Add Rule</button>
    </div>
  </div>

  <div class="examples">
    <h4 class="subsection-title">Examples</h4>
    <ul>
      <li><strong>Tag:</strong> <code>#task</code> - Only checkboxes with #task tag</li>
      <li><strong>Tag wildcard:</strong> <code>#work/*</code> - Any #work subtag</li>
      <li><strong>Path:</strong> <code>projects/</code> - Only in projects folder</li>
      <li><strong>Regex:</strong> <code>TODO:|TASK:</code> - Checkboxes with TODO: or TASK:</li>
      <li><strong>Marker:</strong> <code>@action</code> - Checkboxes with @action marker</li>
    </ul>
  </div>
</div>

<style>
  .global-filter-settings {
    max-width: 100%;
  }

  .settings__section-title {
    margin: 0 0 8px 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--b3-theme-on-surface);
  }

  .description {
    margin: 0 0 16px 0;
    font-size: 14px;
    color: var(--b3-theme-on-surface-light);
  }

  .form-field {
    margin-bottom: 20px;
  }

  .settings__toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 14px;
  }

  .settings__toggle input {
    cursor: pointer;
  }

  .settings__label {
    display: block;
    margin-bottom: 6px;
    font-size: 14px;
    font-weight: 500;
    color: var(--b3-theme-on-surface);
  }

  .settings__input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--b3-border-color);
    border-radius: 6px;
    font-size: 14px;
    background: var(--b3-theme-surface);
    color: var(--b3-theme-on-surface);
    box-sizing: border-box;
  }

  .settings__input:focus {
    outline: none;
    border-color: var(--b3-theme-primary);
  }

  .hint {
    margin: 6px 0 0 0;
    font-size: 13px;
    color: var(--b3-theme-on-surface-light);
  }

  .rules-section,
  .add-rule-section,
  .examples {
    margin-top: 24px;
  }

  .subsection-title {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--b3-theme-on-surface);
  }

  .empty-state {
    margin: 0;
    padding: 16px;
    text-align: center;
    font-size: 14px;
    color: var(--b3-theme-on-surface-light);
    background: var(--b3-theme-surface-lighter);
    border-radius: 6px;
  }

  .rules-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .rule-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border: 1px solid var(--b3-border-color);
    border-radius: 6px;
    background: var(--b3-theme-surface);
  }

  .rule-checkbox {
    cursor: pointer;
    flex-shrink: 0;
  }

  .rule-info {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .rule-type {
    display: inline-block;
    padding: 2px 8px;
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    color: var(--b3-theme-primary);
    background: var(--b3-theme-primary-lighter);
    border-radius: 4px;
  }

  .rule-pattern {
    font-family: monospace;
    font-size: 13px;
    padding: 2px 6px;
    background: var(--b3-theme-surface-lighter);
    border-radius: 3px;
  }

  .rule-description {
    font-size: 13px;
    color: var(--b3-theme-on-surface-light);
  }

  .delete-btn {
    padding: 6px 12px;
    font-size: 13px;
    color: var(--b3-theme-error);
    background: transparent;
    border: 1px solid var(--b3-theme-error);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .delete-btn:hover {
    background: var(--b3-theme-error);
    color: white;
  }

  .add-rule-form {
    display: grid;
    grid-template-columns: 150px 1fr 1fr auto;
    gap: 8px;
    align-items: center;
  }

  @media (max-width: 768px) {
    .add-rule-form {
      grid-template-columns: 1fr;
    }
  }

  .add-btn {
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    color: white;
    background: var(--b3-theme-primary);
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s;
    white-space: nowrap;
  }

  .add-btn:hover {
    background: var(--b3-theme-primary-light);
  }

  .examples ul {
    margin: 0;
    padding-left: 20px;
  }

  .examples li {
    margin-bottom: 8px;
    font-size: 13px;
    color: var(--b3-theme-on-surface);
  }

  .examples code {
    font-family: monospace;
    font-size: 12px;
    padding: 2px 4px;
    background: var(--b3-theme-surface-lighter);
    border-radius: 3px;
  }
</style>
