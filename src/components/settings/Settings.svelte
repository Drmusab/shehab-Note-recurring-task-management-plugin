<script lang="ts">
  import type { NotificationConfig } from "@/services/types";
  import type { NotificationService } from "@/services/NotificationService";
  import { DEFAULT_NOTIFICATION_CONFIG } from "@/utils/constants";
  import { toast } from "@/utils/notifications";

  interface Props {
    notificationService: NotificationService;
    onClose?: () => void;
  }

  let { notificationService, onClose }: Props = $props();

  let config = $state<NotificationConfig>(DEFAULT_NOTIFICATION_CONFIG);
  let testingChannel: string | null = $state(null);
  let testResults = $state<{ [key: string]: { success: boolean; message: string } }>({});

  // Initialize config from service
  $effect(() => {
    config = notificationService.getConfig();
  });

  async function handleSave() {
    try {
      await notificationService.saveConfig(config);
      toast.success("Settings saved successfully!");
      if (onClose) onClose();
    } catch (err) {
      toast.error("Failed to save settings: " + err);
    }
  }

  async function testChannel(channel: "n8n" | "telegram" | "gmail") {
    testingChannel = channel;
    testResults[channel] = { success: false, message: "Testing..." };
    
    try {
      const success = await notificationService.testChannel(channel);
      testResults[channel] = {
        success,
        message: success ? "Test successful!" : "Test failed. Check configuration.",
      };
    } catch (err) {
      testResults[channel] = {
        success: false,
        message: "Error: " + err,
      };
    } finally {
      testingChannel = null;
    }
  }
</script>

<div class="settings">
  <div class="settings__header">
    <h2 class="settings__title">Notification Settings</h2>
    {#if onClose}
      <button class="settings__close-btn" onclick={onClose}>✕</button>
    {/if}
  </div>

  <div class="settings__content">
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

      <button
        class="settings__test-btn"
        onclick={() => testChannel("n8n")}
        disabled={!config.n8n.enabled || testingChannel === "n8n"}
      >
        {testingChannel === "n8n" ? "Testing..." : "Test n8n"}
      </button>
      {#if testResults.n8n}
        <div class="settings__test-result {testResults.n8n.success ? 'success' : 'error'}">
          {testResults.n8n.message}
        </div>
      {/if}
    </section>

    <!-- Telegram Settings -->
    <section class="settings__section">
      <div class="settings__section-header">
        <h3 class="settings__section-title">Telegram</h3>
        <label class="settings__toggle">
          <input type="checkbox" bind:checked={config.telegram.enabled} />
          <span>Enabled</span>
        </label>
      </div>

      <div class="settings__field">
        <label class="settings__label" for="telegram-token">Bot Token</label>
        <input
          id="telegram-token"
          class="settings__input"
          type="password"
          bind:value={config.telegram.botToken}
          placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
          disabled={!config.telegram.enabled}
        />
      </div>

      <div class="settings__field">
        <label class="settings__label" for="telegram-chat">Chat ID</label>
        <input
          id="telegram-chat"
          class="settings__input"
          type="text"
          bind:value={config.telegram.chatId}
          placeholder="123456789"
          disabled={!config.telegram.enabled}
        />
      </div>

      <button
        class="settings__test-btn"
        onclick={() => testChannel("telegram")}
        disabled={!config.telegram.enabled || testingChannel === "telegram"}
      >
        {testingChannel === "telegram" ? "Testing..." : "Test Telegram"}
      </button>
      {#if testResults.telegram}
        <div class="settings__test-result {testResults.telegram.success ? 'success' : 'error'}">
          {testResults.telegram.message}
        </div>
      {/if}
    </section>

    <!-- Gmail Settings -->
    <section class="settings__section">
      <div class="settings__section-header">
        <h3 class="settings__section-title">Gmail</h3>
        <label class="settings__toggle">
          <input type="checkbox" bind:checked={config.gmail.enabled} />
          <span>Enabled</span>
        </label>
      </div>

      <div class="settings__field">
        <label class="settings__label" for="gmail-client-id">Client ID</label>
        <input
          id="gmail-client-id"
          class="settings__input"
          type="text"
          bind:value={config.gmail.clientId}
          placeholder="your-client-id.apps.googleusercontent.com"
          disabled={!config.gmail.enabled}
        />
      </div>

      <div class="settings__field">
        <label class="settings__label" for="gmail-client-secret">Client Secret</label>
        <input
          id="gmail-client-secret"
          class="settings__input"
          type="password"
          bind:value={config.gmail.clientSecret}
          placeholder="Your client secret"
          disabled={!config.gmail.enabled}
        />
      </div>

      <div class="settings__field">
        <label class="settings__label" for="gmail-refresh-token">Refresh Token</label>
        <input
          id="gmail-refresh-token"
          class="settings__input"
          type="password"
          bind:value={config.gmail.refreshToken}
          placeholder="Your refresh token"
          disabled={!config.gmail.enabled}
        />
      </div>

      <div class="settings__field">
        <label class="settings__label" for="gmail-recipient">Recipient Email</label>
        <input
          id="gmail-recipient"
          class="settings__input"
          type="email"
          bind:value={config.gmail.recipientEmail}
          placeholder="recipient@example.com"
          disabled={!config.gmail.enabled}
        />
      </div>

      <button
        class="settings__test-btn"
        onclick={() => testChannel("gmail")}
        disabled={!config.gmail.enabled || testingChannel === "gmail"}
      >
        {testingChannel === "gmail" ? "Testing..." : "Test Gmail"}
      </button>
      {#if testResults.gmail}
        <div class="settings__test-result {testResults.gmail.success ? 'success' : 'error'}">
          {testResults.gmail.message}
        </div>
      {/if}
    </section>
  </div>

  <div class="settings__footer">
    <button class="settings__save-btn" onclick={handleSave}>
      Save Settings
    </button>
  </div>
</div>

<style>
  .settings {
    background: var(--b3-theme-background);
    border-radius: 8px;
    max-width: 700px;
    margin: 0 auto;
  }

  .settings__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid var(--b3-border-color);
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

  .settings__content {
    padding: 24px;
    max-height: 600px;
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
</style>
