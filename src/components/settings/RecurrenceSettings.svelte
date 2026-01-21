<script lang="ts">
  import type { SettingsService } from '@/core/settings/SettingsService';
  import { toast } from '@/utils/notifications';

  interface Props {
    settingsService: SettingsService;
  }

  let { settingsService }: Props = $props();
  
  let settings = $state(settingsService.get());

  async function handlePositionChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    settings.recurrence.newTaskPosition = target.value as 'above' | 'below' | 'end';
    try {
      await settingsService.save(settings);
      toast.success(`Recurrence placement updated`);
    } catch (err) {
      toast.error(`Failed to save settings: ${err}`);
    }
  }

  async function handleToggle(field: 'removeScheduledOnRecurrence' | 'preserveOriginalTime') {
    settings.recurrence[field] = !settings.recurrence[field];
    try {
      await settingsService.save(settings);
      toast.success(`Recurrence setting updated`);
    } catch (err) {
      toast.error(`Failed to save settings: ${err}`);
    }
  }
</script>

<div class="recurrence-settings">
  <h3 class="settings__section-title">Recurrence Settings</h3>
  <p class="description">
    Configure how recurring task instances are created and placed
  </p>

  <div class="form-field">
    <label for="newTaskPosition" class="settings__label">
      New task placement
    </label>
    <select 
      id="newTaskPosition"
      class="settings__select"
      value={settings.recurrence.newTaskPosition}
      onchange={handlePositionChange}
    >
      <option value="above">Above completed task</option>
      <option value="below">Below completed task</option>
      <option value="end">At end of list</option>
    </select>
    <p class="settings__help-text">
      Where to place the next recurring instance when a task is completed
    </p>
  </div>

  <div class="form-field">
    <label class="settings__toggle">
      <input 
        type="checkbox" 
        checked={settings.recurrence.removeScheduledOnRecurrence} 
        onchange={() => handleToggle('removeScheduledOnRecurrence')} 
      />
      <span>Remove scheduled date on recurrence</span>
    </label>
    <p class="settings__help-text">
      When creating the next instance, remove the scheduled date
    </p>
  </div>

  <div class="form-field">
    <label class="settings__toggle">
      <input 
        type="checkbox" 
        checked={settings.recurrence.preserveOriginalTime} 
        onchange={() => handleToggle('preserveOriginalTime')} 
      />
      <span>Preserve original time</span>
    </label>
    <p class="settings__help-text">
      Keep the original time when calculating next occurrence (default: enabled)
    </p>
  </div>
</div>

<style>
  .recurrence-settings {
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

  .settings__label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 500;
    color: var(--b3-theme-on-surface);
  }

  .settings__select {
    width: 100%;
    padding: 8px 12px;
    font-size: 14px;
    border: 1px solid var(--b3-theme-surface-lighter);
    border-radius: 4px;
    background-color: var(--b3-theme-surface);
    color: var(--b3-theme-on-surface);
    cursor: pointer;
  }

  .settings__select:hover {
    border-color: var(--b3-theme-primary-lighter);
  }

  .settings__select:focus {
    outline: none;
    border-color: var(--b3-theme-primary);
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
