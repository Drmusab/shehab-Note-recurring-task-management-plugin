<script lang="ts">
  import type { SettingsService } from '@/core/settings/SettingsService';
  import { toast } from '@/utils/notifications';

  interface Props {
    settingsService: SettingsService;
  }

  let { settingsService }: Props = $props();
  
  let settings = $state(settingsService.get());

  async function handleToggle(field: 'autoAddCreated' | 'autoAddDone' | 'autoAddCancelled') {
    settings.dates[field] = !settings.dates[field];
    try {
      await settingsService.save(settings);
      toast.success(`Date tracking setting updated`);
    } catch (err) {
      toast.error(`Failed to save settings: ${err}`);
    }
  }
</script>

<div class="date-tracking-settings">
  <h3 class="settings__section-title">Automatic Date Tracking</h3>
  <p class="description">
    Automatically add timestamps when tasks are created, completed, or cancelled
  </p>

  <div class="form-field">
    <label class="settings__toggle">
      <input 
        type="checkbox" 
        checked={settings.dates.autoAddCreated} 
        onchange={() => handleToggle('autoAddCreated')} 
      />
      <span>Automatically add created date</span>
    </label>
    <p class="settings__help-text">
      Add creation timestamp when new tasks are created
    </p>
  </div>

  <div class="form-field">
    <label class="settings__toggle">
      <input 
        type="checkbox" 
        checked={settings.dates.autoAddDone} 
        onchange={() => handleToggle('autoAddDone')} 
      />
      <span>Automatically add done date</span>
    </label>
    <p class="settings__help-text">
      Add completion timestamp when tasks are marked as done (default: enabled)
    </p>
  </div>

  <div class="form-field">
    <label class="settings__toggle">
      <input 
        type="checkbox" 
        checked={settings.dates.autoAddCancelled} 
        onchange={() => handleToggle('autoAddCancelled')} 
      />
      <span>Automatically add cancelled date</span>
    </label>
    <p class="settings__help-text">
      Add cancellation timestamp when tasks are marked as cancelled (default: enabled)
    </p>
  </div>
</div>

<style>
  .date-tracking-settings {
    padding: 16px;
  }

  .description {
    margin: 8px 0 20px 0;
    color: var(--b3-theme-on-surface-light);
    font-size: 14px;
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
    color: var(--b3-theme-on-surface);
  }

  .settings__toggle input[type="checkbox"] {
    cursor: pointer;
    width: 18px;
    height: 18px;
  }

  .settings__section-title {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--b3-theme-on-surface);
  }

  .settings__help-text {
    margin: 4px 0 0 26px;
    font-size: 12px;
    color: var(--b3-theme-on-surface-light);
  }
</style>
