/**
 * Plugin settings for Phase 2 features
 */

/**
 * Date tracking settings
 */
export interface DateTrackingSettings {
  /** Automatically add created date when creating tasks */
  autoAddCreated: boolean;
  
  /** Automatically add done date when completing tasks */
  autoAddDone: boolean;
  
  /** Automatically add cancelled date when cancelling tasks */
  autoAddCancelled: boolean;
}

/**
 * Recurrence settings
 */
export interface RecurrenceSettings {
  /** Where to place the new recurring instance */
  newTaskPosition: 'above' | 'below' | 'end';
  
  /** Remove scheduled date when generating next instance */
  removeScheduledOnRecurrence: boolean;
  
  /** Preserve original time when calculating next occurrence */
  preserveOriginalTime: boolean;
}

/**
 * Complete plugin settings
 */
export interface PluginSettings {
  /** Date tracking configuration */
  dates: DateTrackingSettings;
  
  /** Recurrence configuration */
  recurrence: RecurrenceSettings;
}

/**
 * Default settings
 */
export const DEFAULT_SETTINGS: PluginSettings = {
  dates: {
    autoAddCreated: false,
    autoAddDone: true,
    autoAddCancelled: true,
  },
  recurrence: {
    newTaskPosition: 'below',
    removeScheduledOnRecurrence: false,
    preserveOriginalTime: true,
  },
};

/**
 * Merge user settings with defaults
 */
export function mergeSettings(userSettings: Partial<PluginSettings>): PluginSettings {
  return {
    dates: {
      ...DEFAULT_SETTINGS.dates,
      ...userSettings.dates,
    },
    recurrence: {
      ...DEFAULT_SETTINGS.recurrence,
      ...userSettings.recurrence,
    },
  };
}
