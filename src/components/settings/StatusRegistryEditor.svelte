<script lang="ts">
  import { StatusRegistry } from '@/core/models/StatusRegistry';
  import { Status, StatusType, type StatusConfiguration } from '@/core/models/Status';
  import { toast } from '@/utils/notifications';

  let registry = StatusRegistry.getInstance();
  let statuses = $state<Status[]>([]);
  
  let newSymbol = $state('');
  let newName = $state('');
  let newType = $state<StatusType>(StatusType.TODO);
  let newNextSymbol = $state('x');

  function loadStatuses() {
    statuses = registry.getAll();
  }

  function addStatus() {
    if (!newSymbol.trim() || !newName.trim()) {
      toast.error('Symbol and name are required');
      return;
    }

    if (newSymbol.length !== 1) {
      toast.error('Symbol must be a single character');
      return;
    }

    const statusConfig: StatusConfiguration = {
      symbol: newSymbol,
      name: newName,
      type: newType,
      nextStatusSymbol: newNextSymbol,
    };

    const status = new Status(statusConfig);
    registry.register(status);
    loadStatuses();
    resetForm();
    
    toast.success(`Status "${newName}" added`);
  }

  function deleteStatus(symbol: string) {
    // Don't allow deleting default statuses
    const defaultSymbols = [' ', 'x', '/', '-'];
    if (defaultSymbols.includes(symbol)) {
      toast.error('Cannot delete default status');
      return;
    }

    registry.unregister(symbol);
    loadStatuses();
    toast.success('Status deleted');
  }

  function resetToDefaults() {
    if (confirm('Reset all statuses to defaults? This will remove all custom statuses.')) {
      registry.reset();
      loadStatuses();
      toast.success('Statuses reset to defaults');
    }
  }

  function resetForm() {
    newSymbol = '';
    newName = '';
    newType = StatusType.TODO;
    newNextSymbol = 'x';
  }

  $effect(() => {
    loadStatuses();
  });
</script>

<div class="status-registry-editor">
  <h3 class="settings__section-title">Custom Task Statuses</h3>
  <p class="description">
    Define custom checkbox symbols for different task states
  </p>

  <div class="status-list">
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Name</th>
            <th>Type</th>
            <th>Next Symbol</th>
            <th>Example</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each statuses as status}
            <tr>
              <td><code class="status-symbol">[{status.symbol}]</code></td>
              <td>{status.name}</td>
              <td><span class="status-type">{status.type}</span></td>
              <td><code class="status-symbol">[{status.nextStatusSymbol}]</code></td>
              <td class="example-col">
                <code class="example">- [{status.symbol}] Task example</code>
              </td>
              <td>
                {#if ![' ', 'x', '/', '-'].includes(status.symbol)}
                  <button class="delete-btn" onclick={() => deleteStatus(status.symbol)}>
                    Delete
                  </button>
                {:else}
                  <span class="default-badge">Default</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>

  <div class="add-status-section">
    <h4 class="subsection-title">Add Custom Status</h4>
    <div class="add-status-form">
      <div class="form-row">
        <div class="form-field">
          <label class="settings__label">Symbol (1 char)</label>
          <input 
            type="text" 
            bind:value={newSymbol} 
            placeholder="!" 
            maxlength="1"
            class="settings__input"
          />
        </div>
        <div class="form-field">
          <label class="settings__label">Name</label>
          <input 
            type="text" 
            bind:value={newName} 
            placeholder="Important"
            class="settings__input"
          />
        </div>
        <div class="form-field">
          <label class="settings__label">Type</label>
          <select bind:value={newType} class="settings__input">
            <option value={StatusType.TODO}>TODO</option>
            <option value={StatusType.IN_PROGRESS}>IN_PROGRESS</option>
            <option value={StatusType.DONE}>DONE</option>
            <option value={StatusType.CANCELLED}>CANCELLED</option>
            <option value={StatusType.NON_TASK}>NON_TASK</option>
          </select>
        </div>
        <div class="form-field">
          <label class="settings__label">Next Symbol</label>
          <input 
            type="text" 
            bind:value={newNextSymbol} 
            placeholder="x" 
            maxlength="1"
            class="settings__input"
          />
        </div>
        <div class="form-field">
          <label class="settings__label">&nbsp;</label>
          <button onclick={addStatus} class="add-btn">Add Status</button>
        </div>
      </div>
    </div>
  </div>

  <div class="actions">
    <button class="reset-btn" onclick={resetToDefaults}>Reset to Defaults</button>
  </div>

  <div class="info-section">
    <h4 class="subsection-title">About Custom Statuses</h4>
    <ul>
      <li><strong>Symbol:</strong> The character shown in the checkbox (e.g., <code>[!]</code>)</li>
      <li><strong>Type:</strong> Determines how the task is treated (active, completed, etc.)</li>
      <li><strong>Next Symbol:</strong> What symbol to use when toggling the task</li>
      <li><strong>Examples:</strong> <code>[!]</code> for urgent, <code>[?]</code> for question, <code>[&gt;]</code> for forwarded</li>
    </ul>
  </div>
</div>

<style>
  .status-registry-editor {
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

  .status-list {
    margin-bottom: 24px;
  }

  .table-container {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  thead {
    background: var(--b3-theme-surface-lighter);
  }

  th {
    padding: 10px 12px;
    text-align: left;
    font-weight: 600;
    color: var(--b3-theme-on-surface);
    border-bottom: 2px solid var(--b3-border-color);
  }

  td {
    padding: 10px 12px;
    border-bottom: 1px solid var(--b3-border-color);
    color: var(--b3-theme-on-surface);
  }

  tbody tr:hover {
    background: var(--b3-theme-surface-lighter);
  }

  .status-symbol {
    font-family: monospace;
    font-size: 14px;
    font-weight: bold;
    padding: 2px 6px;
    background: var(--b3-theme-surface-lighter);
    border-radius: 3px;
  }

  .status-type {
    display: inline-block;
    padding: 2px 8px;
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    background: var(--b3-theme-surface-lighter);
    border-radius: 4px;
  }

  .example-col {
    font-family: monospace;
  }

  .example {
    font-size: 12px;
    padding: 2px 6px;
    background: var(--b3-theme-surface-lighter);
    border-radius: 3px;
  }

  .default-badge {
    display: inline-block;
    padding: 4px 8px;
    font-size: 11px;
    font-weight: 500;
    color: var(--b3-theme-on-surface-light);
    background: var(--b3-theme-surface-lighter);
    border-radius: 4px;
  }

  .delete-btn {
    padding: 6px 12px;
    font-size: 12px;
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

  .add-status-section {
    margin-top: 24px;
    padding: 16px;
    background: var(--b3-theme-surface-lighter);
    border-radius: 8px;
  }

  .subsection-title {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--b3-theme-on-surface);
  }

  .form-row {
    display: grid;
    grid-template-columns: 100px 1fr 150px 120px auto;
    gap: 12px;
    align-items: end;
  }

  @media (max-width: 768px) {
    .form-row {
      grid-template-columns: 1fr;
    }
  }

  .form-field {
    display: flex;
    flex-direction: column;
  }

  .settings__label {
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
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

  .actions {
    margin-top: 16px;
    display: flex;
    gap: 8px;
  }

  .reset-btn {
    padding: 8px 16px;
    font-size: 14px;
    color: var(--b3-theme-on-surface);
    background: var(--b3-theme-surface-lighter);
    border: 1px solid var(--b3-border-color);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .reset-btn:hover {
    background: var(--b3-theme-surface-light);
  }

  .info-section {
    margin-top: 24px;
    padding: 16px;
    background: var(--b3-theme-surface-lighter);
    border-radius: 8px;
  }

  .info-section ul {
    margin: 0;
    padding-left: 20px;
  }

  .info-section li {
    margin-bottom: 8px;
    font-size: 13px;
    color: var(--b3-theme-on-surface);
  }

  .info-section code {
    font-family: monospace;
    font-size: 12px;
    padding: 2px 4px;
    background: var(--b3-theme-surface);
    border-radius: 3px;
  }
</style>
