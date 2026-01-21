<script lang="ts">
  import type { SettingsService } from '@/core/settings/SettingsService';
  import type { TaskRepositoryProvider } from '@/core/storage/TaskRepository';
  import { GlobalFilter } from '@/core/filtering/GlobalFilter';
  import { DEFAULT_GLOBAL_FILTER_CONFIG, type GlobalFilterConfig } from '@/core/filtering/FilterRule';
  import { GlobalQuery, DEFAULT_GLOBAL_QUERY_CONFIG, type GlobalQueryConfig } from '@/core/query/GlobalQuery';
  import { StatusType } from '@/core/models/Status';
  import { QueryParser } from '@/core/query/QueryParser';
  import { explainQuery } from '@/core/query/QueryExplain';
  import { pluginEventBus } from '@/core/events/PluginEventBus';
  import { toast } from '@/utils/notifications';

  interface Props {
    settingsService: SettingsService;
    repository: TaskRepositoryProvider;
  }

  let { settingsService, repository }: Props = $props();

  const globalFilter = GlobalFilter.getInstance();
  const globalQuery = GlobalQuery.getInstance();

  let filterConfig = $state<GlobalFilterConfig>(
    settingsService.get().globalFilter ?? DEFAULT_GLOBAL_FILTER_CONFIG
  );
  let queryConfig = $state<GlobalQueryConfig>(
    settingsService.get().globalQuery ?? DEFAULT_GLOBAL_QUERY_CONFIG
  );

  let folderDraft = $state('');
  let notebookDraft = $state('');
  let tagDraft = $state('');
  let filePatternDraft = $state('');

  let excludedPreview = $state<number | null>(null);
  let queryValidation = $state<{ valid: boolean; message: string } | null>(null);
  let queryExplanation = $state<string | null>(null);

  const statusTypes = Object.values(StatusType);

  $effect(() => {
    updateExcludedPreview();
  });

  function normalizeList(list: string[]) {
    return Array.from(new Set(list.map((item) => item.trim()).filter(Boolean)));
  }

  function addToList(key: keyof GlobalFilterConfig, value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;

    filterConfig = {
      ...filterConfig,
      [key]: normalizeList([...(filterConfig[key] as string[]), trimmed]),
    };
    saveFilterConfig();
  }

  function removeFromList(key: keyof GlobalFilterConfig, value: string) {
    filterConfig = {
      ...filterConfig,
      [key]: (filterConfig[key] as string[]).filter((item) => item !== value),
    };
    saveFilterConfig();
  }

  function toggleStatusType(type: StatusType) {
    const current = new Set(filterConfig.excludeStatusTypes);
    if (current.has(type)) {
      current.delete(type);
    } else {
      current.add(type);
    }
    filterConfig = {
      ...filterConfig,
      excludeStatusTypes: Array.from(current),
    };
    saveFilterConfig();
  }

  async function saveFilterConfig() {
    globalFilter.updateConfig(filterConfig);
    await settingsService.update({ globalFilter: filterConfig });
    pluginEventBus.emit('task:settings', { source: 'global-filter' });
    updateExcludedPreview();
  }

  async function saveQueryConfig() {
    globalQuery.updateConfig(queryConfig);
    await settingsService.update({ globalQuery: queryConfig });
    pluginEventBus.emit('task:settings', { source: 'global-query' });
  }

  function updateExcludedPreview() {
    if (!repository) {
      excludedPreview = null;
      return;
    }
    const tasks = repository.getAllTasks();
    excludedPreview = tasks.filter((task) => !globalFilter.shouldIncludeTask(task)).length;
  }

  async function resetGlobalFilter() {
    filterConfig = { ...DEFAULT_GLOBAL_FILTER_CONFIG };
    await saveFilterConfig();
    toast.success('Global filter reset to defaults');
  }

  async function resetGlobalQuery() {
    queryConfig = { ...DEFAULT_GLOBAL_QUERY_CONFIG };
    queryValidation = null;
    queryExplanation = null;
    await saveQueryConfig();
    toast.success('Global query reset to defaults');
  }

  function validateGlobalQuery() {
    const parser = new QueryParser();
    try {
      const ast = parser.parse(queryConfig.query || '');
      queryValidation = { valid: true, message: 'Global query is valid.' };
      queryExplanation = explainQuery(ast);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      queryValidation = { valid: false, message };
      queryExplanation = null;
    }
  }
</script>

<div class="global-filter-settings">
  <h3 class="settings__section-title">Global Filtering &amp; Query</h3>
  <p class="description">
    Apply a hard exclusion filter before indexing, plus a default query fragment applied to every query.
  </p>

  <section class="settings__section">
    <div class="settings__section-header">
      <h4 class="subsection-title">Global Filter (Hard Exclusions)</h4>
      <label class="settings__toggle">
        <input type="checkbox" bind:checked={filterConfig.enabled} onchange={saveFilterConfig} />
        <span>Enable Global Filter</span>
      </label>
    </div>

    <div class="preview">
      {#if excludedPreview !== null}
        <span>Preview: {excludedPreview} tasks excluded (from current index)</span>
      {:else}
        <span>Preview unavailable</span>
      {/if}
    </div>

    <div class="form-field">
      <label class="settings__label">Exclude Folders</label>
      <div class="pill-list">
        {#each filterConfig.excludeFolders as folder}
          <button class="pill" type="button" onclick={() => removeFromList('excludeFolders', folder)}>
            {folder} ✕
          </button>
        {/each}
      </div>
      <div class="input-row">
        <input
          class="settings__input"
          type="text"
          placeholder="/archive/**"
          bind:value={folderDraft}
        />
        <button class="add-btn" type="button" onclick={() => { addToList('excludeFolders', folderDraft); folderDraft = ''; }}>
          Add
        </button>
      </div>
    </div>

    <div class="form-field">
      <label class="settings__label">Exclude Notebooks</label>
      <div class="pill-list">
        {#each filterConfig.excludeNotebooks as notebook}
          <button class="pill" type="button" onclick={() => removeFromList('excludeNotebooks', notebook)}>
            {notebook} ✕
          </button>
        {/each}
      </div>
      <div class="input-row">
        <input
          class="settings__input"
          type="text"
          placeholder="Personal"
          bind:value={notebookDraft}
        />
        <button class="add-btn" type="button" onclick={() => { addToList('excludeNotebooks', notebookDraft); notebookDraft = ''; }}>
          Add
        </button>
      </div>
    </div>

    <div class="form-field">
      <label class="settings__label">Exclude Tags</label>
      <div class="pill-list">
        {#each filterConfig.excludeTags as tag}
          <button class="pill" type="button" onclick={() => removeFromList('excludeTags', tag)}>
            {tag} ✕
          </button>
        {/each}
      </div>
      <div class="input-row">
        <input
          class="settings__input"
          type="text"
          placeholder="#log"
          bind:value={tagDraft}
        />
        <button class="add-btn" type="button" onclick={() => { addToList('excludeTags', tagDraft); tagDraft = ''; }}>
          Add
        </button>
      </div>
    </div>

    <div class="form-field">
      <label class="settings__label">Exclude File Patterns (glob or /regex/)</label>
      <div class="pill-list">
        {#each filterConfig.excludeFilePatterns as pattern}
          <button class="pill" type="button" onclick={() => removeFromList('excludeFilePatterns', pattern)}>
            {pattern} ✕
          </button>
        {/each}
      </div>
      <div class="input-row">
        <input
          class="settings__input"
          type="text"
          placeholder="/templates/** or /daily/.+\.md/"
          bind:value={filePatternDraft}
        />
        <button
          class="add-btn"
          type="button"
          onclick={() => { addToList('excludeFilePatterns', filePatternDraft); filePatternDraft = ''; }}
        >
          Add
        </button>
      </div>
    </div>

    <div class="form-field">
      <label class="settings__label">Exclude Status Types</label>
      <div class="status-toggle-list">
        {#each statusTypes as type}
          <label class="status-toggle">
            <input
              type="checkbox"
              checked={filterConfig.excludeStatusTypes.includes(type)}
              onchange={() => toggleStatusType(type)}
            />
            <span>{type}</span>
          </label>
        {/each}
      </div>
    </div>

    <button class="reset-btn" type="button" onclick={resetGlobalFilter}>Reset Global Filter</button>
  </section>

  <section class="settings__section">
    <div class="settings__section-header">
      <h4 class="subsection-title">Global Query (Default Conditions)</h4>
      <label class="settings__toggle">
        <input type="checkbox" bind:checked={queryConfig.enabled} onchange={saveQueryConfig} />
        <span>Enable Global Query</span>
      </label>
    </div>

    <div class="form-field">
      <label class="settings__label">Global Query DSL</label>
      <textarea
        class="settings__input"
        rows="4"
        placeholder="not done\nnot blocked\ndue before next 30 days"
        bind:value={queryConfig.query}
      ></textarea>
    </div>

    <div class="query-actions">
      <button class="add-btn" type="button" onclick={saveQueryConfig}>Save Global Query</button>
      <button class="add-btn" type="button" onclick={validateGlobalQuery}>Validate / Explain</button>
      <button class="reset-btn" type="button" onclick={resetGlobalQuery}>Reset Global Query</button>
    </div>

    {#if queryValidation}
      <div class="validation {queryValidation.valid ? 'success' : 'error'}">
        {queryValidation.message}
      </div>
    {/if}

    {#if queryExplanation}
      <pre class="query-explanation">{queryExplanation}</pre>
    {/if}

    <p class="hint">
      Use <code>ignore global query</code> on a local query line to bypass the global query for that block.
    </p>
  </section>
</div>

<style>
  .global-filter-settings {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .settings__section-title {
    margin: 0 0 8px 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--b3-theme-on-surface);
  }

  .description {
    margin: 0 0 12px 0;
    font-size: 14px;
    color: var(--b3-theme-on-surface-light);
  }

  .settings__section {
    padding: 16px;
    border: 1px solid var(--b3-border-color);
    border-radius: 8px;
    background: var(--b3-theme-surface);
  }

  .settings__section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    gap: 12px;
  }

  .subsection-title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--b3-theme-on-surface);
  }

  .settings__toggle {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .form-field {
    margin-bottom: 16px;
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

  .input-row {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }

  .add-btn,
  .reset-btn {
    padding: 6px 12px;
    border-radius: 6px;
    border: 1px solid var(--b3-border-color);
    background: var(--b3-theme-surface-light);
    color: var(--b3-theme-on-surface);
    cursor: pointer;
  }

  .reset-btn {
    margin-top: 8px;
  }

  .pill-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .pill {
    border: 1px solid var(--b3-border-color);
    border-radius: 999px;
    padding: 4px 10px;
    background: var(--b3-theme-surface-light);
    font-size: 12px;
    cursor: pointer;
  }

  .status-toggle-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 8px;
  }

  .status-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
  }

  .preview {
    font-size: 12px;
    color: var(--b3-theme-on-surface-light);
    margin-bottom: 12px;
  }

  .query-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }

  .validation {
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 13px;
    margin-bottom: 8px;
  }

  .validation.success {
    background: rgba(76, 175, 80, 0.15);
    color: var(--b3-theme-on-surface);
  }

  .validation.error {
    background: rgba(244, 67, 54, 0.15);
    color: var(--b3-theme-on-surface);
  }

  .query-explanation {
    padding: 12px;
    border-radius: 6px;
    background: var(--b3-theme-surface-light);
    border: 1px solid var(--b3-border-color);
    font-size: 12px;
    white-space: pre-wrap;
  }

  .hint {
    font-size: 12px;
    color: var(--b3-theme-on-surface-light);
  }
</style>
