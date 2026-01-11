/**
 * Plugin constants
 */

export const PLUGIN_NAME = "plugin-sample-shehab-note";

export const STORAGE_KEY = "recurring-tasks";

export const SETTINGS_KEY = "n8n-event-settings";

export const EVENT_QUEUE_KEY = "n8n-event-queue";

export const DOCK_TYPE = "recurring-tasks-dock";

/**
 * Default n8n event configuration
 */
export const DEFAULT_NOTIFICATION_CONFIG = {
  n8n: {
    webhookUrl: "",
    sharedSecret: "",
    enabled: false,
  },
};

/**
 * Scheduler interval (check every minute)
 */
export const SCHEDULER_INTERVAL_MS = 60 * 1000;

export const EVENT_QUEUE_INTERVAL_MS = 30 * 1000;

export const EVENT_DEDUPE_LIMIT = 2000;

export const PLUGIN_EVENT_SOURCE = "shehab-note-recurring-plugin";

export const PLUGIN_EVENT_VERSION = "1.0.0";

export const MISSED_GRACE_PERIOD_MS = 60 * 60 * 1000;

/**
 * Timeline days to show
 */
export const TIMELINE_DAYS = 30;
