<script lang="ts">
  import type { NotificationConfig } from "@/services/types";
  import type { EventService } from "@/services/EventService";
  import { DEFAULT_NOTIFICATION_CONFIG } from "@/utils/constants";
  import { toast } from "@/utils/notifications";
  import { SHORTCUTS } from "@/utils/shortcuts";
  import GlobalFilterSettings from './GlobalFilterSettings.svelte';
  import StatusRegistryEditor from './StatusRegistryEditor.svelte';

  interface Props {
    eventService: EventService;
    onClose?: () => void;
  }

  let { eventService, onClose }: Props = $props();

  let config = $state<NotificationConfig>(DEFAULT_NOTIFICATION_CONFIG);
  let testingChannel: string | null = $state(null);
  let testResults = $state<{ [key: string]: { success: boolean; message: string } }>({});
  let activeSection = $state<'general' | 'filter' | 'statuses' | 'shortcuts'>('general');

  // Initialize config from service
  $effect(() => {
    config = eventService.getConfig();
  });

  async function handleSave() {
    try {
      await eventService.saveConfig(config);
      toast.success("Settings saved successfully!");
      if (onClose) onClose();
    } catch (err) {
      toast.error("Failed to save settings: " + err);
    }
  }

  async function testConnection() {
    testingChannel = "n8n";
    testResults.n8n = { success: false, message: "Testing..." };

    try {
      const result = await eventService.testConnection();
      testResults.n8n = {
        success: result.success,
        message: result.success ? "Test successful!" : result.message || "Test failed. Check configuration.",
      };
    } catch (err) {
      testResults.n8n = {
        success: false,
        message: "Error: " + (err instanceof Error ? err.message : String(err)),
      };
    } finally {
      testingChannel = null;
    }
  }
</script>

<div class="settings">
  <div class="settings__header">
    <h2 class="settings__title">Settings</h2>
    {#if onClose}
      <button class="settings__close-btn" onclick={onClose}>✕</button>
    {/if}
  </div>

  <div class="settings__layout">
    <nav class="settings__nav">
      <button 
        class="settings__nav-btn {activeSection === 'general' ? 'active' : ''}"
        onclick={() => activeSection = 'general'}
      >
        General
      </button>
      <button 
        class="settings__nav-btn {activeSection === 'filter' ? 'active' : ''}"
        onclick={() => activeSection = 'filter'}
      >
        Global Filter
      </button>
      <button 
        class="settings__nav-btn {activeSection === 'statuses' ? 'active' : ''}"
        onclick={() => activeSection = 'statuses'}
      >
        Custom Statuses
      </button>
      <button 
        class="settings__nav-btn {activeSection === 'shortcuts' ? 'active' : ''}"
        onclick={() => activeSection = 'shortcuts'}
      >
        Shortcuts
      </button>
    </nav>

    <div class="settings__content">
      {#if activeSection === 'general'}
        <!-- n8n Settings -->
        <section class="settings__section">
          <div class="settings__section-header">
            <h3 class="settings__section-title">n8n Webhook</h3>
            <label class="settings__toggle">
              <input type="checkbox" bind:checked={config.n8n.enabled} />
              <span>Enabled</span>
            </label>
          </div>

          <div class="settings__field">
            <label class="settings__label" for="n8n-webhook">Webhook URL</label>
            <input
              id="n8n-webhook"
              class="settings__input"
              type="url"
              bind:value={config.n8n.webhookUrl}
              placeholder="https://your-n8n-instance.com/webhook/..."
              disabled={!config.n8n.enabled}
            />
          </div>

          <div class="settings__field">
            <label class="settings__label" for="n8n-secret">Shared Secret</label>
            <input
              id="n8n-secret"
              class="settings__input"
              type="password"
              bind:value={config.n8n.sharedSecret}
              placeholder="Optional shared secret"
              disabled={!config.n8n.enabled}
            />
          </div>

          <button
            class="settings__test-btn"
            onclick={testConnection}
            disabled={!config.n8n.enabled || testingChannel === "n8n"}
          >
            {testingChannel === "n8n" ? "Testing..." : "Test Connection"}
          </button>
          {#if testResults.n8n}
            <div class="settings__test-result {testResults.n8n.success ? 'success' : 'error'}">
              {testResults.n8n.message}
            </div>
          {/if}
        </section>
      {:else if activeSection === 'filter'}
        <GlobalFilterSettings />
      {:else if activeSection === 'statuses'}
        <StatusRegistryEditor />
      {:else if activeSection === 'shortcuts'}
        <section class="settings__section">
          <div class="settings__section-header">
            <h3 class="settings__section-title">Keyboard Shortcuts</h3>
          </div>
          <div class="settings__shortcuts">
            {#each SHORTCUTS as shortcut}
              <div class="settings__shortcut">
                <div class="settings__shortcut-main">
                  <div class="settings__shortcut-label">{shortcut.label}</div>
                  <div class="settings__shortcut-description">{shortcut.description}</div>
                  {#if shortcut.context}
                    <div class="settings__shortcut-context">{shortcut.context}</div>
                  {/if}
                </div>
                <div class="settings__shortcut-keys">{shortcut.keys}</div>
              </div>
            {/each}
          </div>
        </section>
      {/if}
    </div>
  </div>

  {#if activeSection === 'general'}
    <div class="settings__footer">
      <button class="settings__save-btn" onclick={handleSave}>
        Save Settings
      </button>
    </div>
  {/if}
</div>

<style>
  .settings {
    background: var(--b3-theme-background);
    border-radius: 8px;
    max-width: 900px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    max-height: 90vh;
  }

  .settings__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid var(--b3-border-color);
    flex-shrink: 0;
  }

  .settings__title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: var(--b3-theme-on-surface);
  }

  .settings__close-btn {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    color: var(--b3-theme-on-surface-light);
  }

  .settings__close-btn:hover {
    background: var(--b3-theme-surface-lighter);
  }

  .settings__layout {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .settings__nav {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 16px;
    border-right: 1px solid var(--b3-border-color);
    background: var(--b3-theme-surface-lighter);
    min-width: 180px;
  }

  .settings__nav-btn {
    padding: 10px 16px;
    text-align: left;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    color: var(--b3-theme-on-surface);
    transition: all 0.2s;
  }

  .settings__nav-btn:hover {
    background: var(--b3-theme-surface);
  }

  .settings__nav-btn.active {
    background: var(--b3-theme-primary);
    color: white;
    font-weight: 500;
  }

  .settings__content {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
  }

  .settings__section {
    margin-bottom: 32px;
    padding-bottom: 32px;
    border-bottom: 1px solid var(--b3-border-color);
  }

  .settings__section:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }

  .settings__section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .settings__section-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--b3-theme-on-surface);
  }

  .settings__toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }

  .settings__toggle input {
    cursor: pointer;
  }

  .settings__field {
    margin-bottom: 16px;
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

  .settings__input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .settings__input:focus {
    outline: none;
    border-color: var(--b3-theme-primary);
  }

  .settings__test-btn {
    padding: 8px 16px;
    background: var(--b3-theme-surface-lighter);
    color: var(--b3-theme-on-surface);
    border: 1px solid var(--b3-border-color);
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .settings__test-btn:hover:not(:disabled) {
    background: var(--b3-theme-surface-light);
  }

  .settings__test-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .settings__test-result {
    margin-top: 8px;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 13px;
  }

  .settings__test-result.success {
    background: #d4edda;
    color: #155724;
  }

  .settings__test-result.error {
    background: #f8d7da;
    color: #721c24;
  }

  .settings__footer {
    padding: 16px 24px;
    border-top: 1px solid var(--b3-border-color);
    text-align: right;
    flex-shrink: 0;
  }

  .settings__shortcuts {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .settings__shortcut {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 12px 14px;
    border: 1px solid var(--b3-border-color);
    border-radius: 8px;
    background: var(--b3-theme-surface);
  }

  .settings__shortcut-main {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .settings__shortcut-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--b3-theme-on-surface);
  }

  .settings__shortcut-description {
    font-size: 13px;
    color: var(--b3-theme-on-surface-light);
  }

  .settings__shortcut-context {
    font-size: 12px;
    color: var(--b3-theme-on-surface-light);
  }

  .settings__shortcut-keys {
    font-family: "SF Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 13px;
    padding: 6px 10px;
    border-radius: 6px;
    border: 1px solid var(--b3-border-color);
    background: var(--b3-theme-surface-lighter);
    color: var(--b3-theme-on-surface);
    align-self: center;
    white-space: nowrap;
  }

  .settings__save-btn {
    padding: 10px 24px;
    background: var(--b3-theme-primary);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }

  .settings__save-btn:hover {
    background: var(--b3-theme-primary-light);
  }

  @media (max-width: 768px) {
    .settings__layout {
      flex-direction: column;
    }

    .settings__nav {
      flex-direction: row;
      overflow-x: auto;
      border-right: none;
      border-bottom: 1px solid var(--b3-border-color);
      min-width: unset;
    }

    .settings__nav-btn {
      white-space: nowrap;
    }
  }
</style>
