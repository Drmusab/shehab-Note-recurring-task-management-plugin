<script lang="ts">
  import type { Task, CrossNoteDependency, DependencyCondition } from '@/core/models/Task';
  import { CrossNoteDependencyChecker } from '@/core/dependencies/CrossNoteDependencyChecker';
  import type { SiYuanApiAdapter } from '@/core/api/SiYuanApiAdapter';

  interface Props {
    task: Task;
    siyuanAPI?: SiYuanApiAdapter;
    onUpdate?: (task: Task) => void;
  }

  let { task, siyuanAPI, onUpdate }: Props = $props();

  let showAddForm = $state(false);
  let newDependency = $state<Partial<CrossNoteDependency>>({
    type: 'blockExists',
    condition: { operator: 'exists' },
    status: 'checking'
  });

  const dependencyTypes = [
    { value: 'blockExists', label: 'Block Exists' },
    { value: 'blockContent', label: 'Block Content' },
    { value: 'noteAttribute', label: 'Note Attribute' },
    { value: 'tagPresence', label: 'Tag Present' },
    { value: 'backlinks', label: 'Backlink Count' }
  ];

  const operators = [
    { value: 'exists', label: 'Exists' },
    { value: 'equals', label: 'Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'greaterThan', label: 'Greater Than' },
    { value: 'lessThan', label: 'Less Than' },
    { value: 'matches', label: 'Matches (Regex)' }
  ];

  function addDependency() {
    if (!newDependency.type || !newDependency.condition) {
      return;
    }

    const dependency: CrossNoteDependency = {
      id: generateDependencyId(),
      type: newDependency.type as any,
      target: newDependency.target || {},
      condition: newDependency.condition,
      status: 'checking',
      lastChecked: new Date().toISOString()
    };

    if (!task.crossNoteDependencies) {
      task.crossNoteDependencies = [];
    }
    task.crossNoteDependencies.push(dependency);

    // Reset form
    newDependency = {
      type: 'blockExists',
      condition: { operator: 'exists' },
      status: 'checking'
    };
    showAddForm = false;

    onUpdate?.(task);
  }

  function removeDependency(id: string) {
    if (!task.crossNoteDependencies) return;
    
    task.crossNoteDependencies = task.crossNoteDependencies.filter(d => d.id !== id);
    onUpdate?.(task);
  }

  async function checkDependency(dep: CrossNoteDependency) {
    if (!siyuanAPI) return;

    const checker = new CrossNoteDependencyChecker(siyuanAPI);
    const isMet = await checker.checkDependency(dep);
    
    dep.status = isMet ? 'met' : 'unmet';
    dep.lastChecked = new Date().toISOString();
    
    onUpdate?.(task);
  }

  async function checkAllDependencies() {
    if (!siyuanAPI || !task.crossNoteDependencies) return;

    const checker = new CrossNoteDependencyChecker(siyuanAPI);
    await checker.checkAllDependencies(task);
    
    onUpdate?.(task);
  }

  function generateDependencyId(): string {
    return `dep_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  function getStatusColor(status: 'met' | 'unmet' | 'checking'): string {
    switch (status) {
      case 'met': return '#4caf50';
      case 'unmet': return '#f44336';
      case 'checking': return '#ff9800';
    }
  }

  function getStatusIcon(status: 'met' | 'unmet' | 'checking'): string {
    switch (status) {
      case 'met': return '✓';
      case 'unmet': return '✗';
      case 'checking': return '?';
    }
  }

  function formatDependencyTarget(dep: CrossNoteDependency): string {
    if (dep.target.blockId) return `Block: ${dep.target.blockId.slice(0, 8)}...`;
    if (dep.target.notePath) return `Note: ${dep.target.notePath}`;
    if (dep.target.tag) return `Tag: ${dep.target.tag}`;
    if (dep.target.attribute) return `Attribute: ${dep.target.attribute}`;
    return 'Not specified';
  }

  function formatCondition(condition: DependencyCondition): string {
    let result = condition.operator;
    if (condition.value !== undefined) {
      result += ` "${condition.value}"`;
    }
    if (condition.caseSensitive) {
      result += ' (case-sensitive)';
    }
    return result;
  }
</script>

<div class="dependency-manager">
  <div class="manager-header">
    <h3>Cross-Note Dependencies</h3>
    {#if task.crossNoteDependencies && task.crossNoteDependencies.length > 0}
      <button onclick={checkAllDependencies} class="check-all-btn">
        Check All
      </button>
    {/if}
  </div>

  {#if task.crossNoteDependencies && task.crossNoteDependencies.length > 0}
    <div class="dependencies-list">
      {#each task.crossNoteDependencies as dep}
        <div class="dependency-card">
          <div class="dependency-header">
            <div class="dependency-status" style="background-color: {getStatusColor(dep.status)}">
              {getStatusIcon(dep.status)}
            </div>
            <div class="dependency-info">
              <span class="dependency-type">{dep.type.replace(/([A-Z])/g, ' $1').trim()}</span>
              <span class="dependency-target">{formatDependencyTarget(dep)}</span>
            </div>
            <button onclick={() => removeDependency(dep.id)} class="remove-btn" title="Remove dependency">
              ×
            </button>
          </div>

          <div class="dependency-details">
            <div class="detail-row">
              <span class="detail-label">Condition:</span>
              <span class="detail-value">{formatCondition(dep.condition)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Last Checked:</span>
              <span class="detail-value">
                {new Date(dep.lastChecked).toLocaleString()}
              </span>
            </div>
          </div>

          <button onclick={() => checkDependency(dep)} class="check-btn">
            Re-check
          </button>
        </div>
      {/each}
    </div>
  {:else}
    <div class="empty-state">
      <p>No dependencies configured</p>
    </div>
  {/if}

  {#if !showAddForm}
    <button onclick={() => showAddForm = true} class="add-dependency-btn">
      + Add Dependency
    </button>
  {:else}
    <div class="add-form">
      <h4>Add New Dependency</h4>

      <div class="form-group">
        <label>Dependency Type</label>
        <select bind:value={newDependency.type}>
          {#each dependencyTypes as type}
            <option value={type.value}>{type.label}</option>
          {/each}
        </select>
      </div>

      {#if newDependency.type === 'blockExists' || newDependency.type === 'blockContent' || newDependency.type === 'noteAttribute' || newDependency.type === 'backlinks'}
        <div class="form-group">
          <label>Block ID</label>
          <input
            type="text"
            bind:value={newDependency.target.blockId}
            placeholder="20210101123456-abcdefg"
          />
        </div>
      {/if}

      {#if newDependency.type === 'noteAttribute'}
        <div class="form-group">
          <label>Attribute Name</label>
          <input
            type="text"
            bind:value={newDependency.target.attribute}
            placeholder="status"
          />
        </div>
      {/if}

      {#if newDependency.type === 'tagPresence'}
        <div class="form-group">
          <label>Tag</label>
          <input
            type="text"
            bind:value={newDependency.target.tag}
            placeholder="important"
          />
        </div>
      {/if}

      <div class="form-group">
        <label>Condition Operator</label>
        <select bind:value={newDependency.condition.operator}>
          {#each operators as op}
            <option value={op.value}>{op.label}</option>
          {/each}
        </select>
      </div>

      {#if newDependency.condition?.operator && ['equals', 'contains', 'greaterThan', 'lessThan', 'matches'].includes(newDependency.condition.operator)}
        <div class="form-group">
          <label>Value</label>
          <input
            type="text"
            bind:value={newDependency.condition.value}
            placeholder="Enter value..."
          />
        </div>
      {/if}

      {#if newDependency.condition?.operator && ['equals', 'contains', 'matches'].includes(newDependency.condition.operator)}
        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" bind:checked={newDependency.condition.caseSensitive} />
            Case Sensitive
          </label>
        </div>
      {/if}

      <div class="form-actions">
        <button onclick={addDependency} class="save-btn">Add</button>
        <button onclick={() => showAddForm = false} class="cancel-btn">Cancel</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .dependency-manager {
    padding: 1rem;
    background-color: var(--b3-theme-surface);
    border-radius: 8px;
    border: 1px solid var(--b3-border-color);
  }

  .manager-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .manager-header h3 {
    margin: 0;
    font-size: 1.1rem;
    color: var(--b3-theme-on-background);
  }

  .check-all-btn {
    padding: 0.5rem 1rem;
    background-color: var(--b3-theme-primary);
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .dependencies-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .dependency-card {
    padding: 1rem;
    background-color: var(--b3-theme-background);
    border-radius: 4px;
    border: 1px solid var(--b3-border-color);
  }

  .dependency-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .dependency-status {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    flex-shrink: 0;
  }

  .dependency-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .dependency-type {
    font-weight: 600;
    color: var(--b3-theme-on-surface);
    text-transform: capitalize;
  }

  .dependency-target {
    font-size: 0.85rem;
    color: var(--b3-theme-on-surface-light);
  }

  .remove-btn {
    width: 28px;
    height: 28px;
    border-radius: 4px;
    background-color: transparent;
    border: 1px solid var(--b3-border-color);
    color: var(--b3-theme-on-surface);
    font-size: 1.5rem;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .remove-btn:hover {
    background-color: #f44336;
    color: white;
    border-color: #f44336;
  }

  .dependency-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .detail-row {
    display: flex;
    gap: 0.5rem;
  }

  .detail-label {
    font-weight: 600;
    color: var(--b3-theme-on-surface-light);
    min-width: 100px;
  }

  .detail-value {
    color: var(--b3-theme-on-surface);
  }

  .check-btn {
    padding: 0.5rem 1rem;
    background-color: var(--b3-theme-surface);
    border: 1px solid var(--b3-border-color);
    border-radius: 4px;
    color: var(--b3-theme-on-surface);
    cursor: pointer;
    font-size: 0.9rem;
  }

  .check-btn:hover {
    background-color: var(--b3-theme-background);
  }

  .empty-state {
    text-align: center;
    padding: 2rem;
    color: var(--b3-theme-on-surface-light);
  }

  .add-dependency-btn {
    width: 100%;
    padding: 0.75rem;
    background-color: var(--b3-theme-primary);
    color: white;
    border: none;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
  }

  .add-form {
    padding: 1rem;
    background-color: var(--b3-theme-background);
    border-radius: 4px;
    border: 2px solid var(--b3-theme-primary);
  }

  .add-form h4 {
    margin: 0 0 1rem 0;
    color: var(--b3-theme-on-background);
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.25rem;
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--b3-theme-on-surface);
  }

  .form-group input,
  .form-group select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--b3-border-color);
    border-radius: 4px;
    background-color: var(--b3-theme-surface);
    color: var(--b3-theme-on-surface);
    font-family: inherit;
  }

  .checkbox-group label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: normal;
  }

  .checkbox-group input[type="checkbox"] {
    width: auto;
  }

  .form-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .save-btn,
  .cancel-btn {
    flex: 1;
    padding: 0.75rem;
    border: none;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
  }

  .save-btn {
    background-color: var(--b3-theme-primary);
    color: white;
  }

  .cancel-btn {
    background-color: var(--b3-theme-surface);
    color: var(--b3-theme-on-surface);
    border: 1px solid var(--b3-border-color);
  }
</style>
