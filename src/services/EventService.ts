import type { Plugin } from "siyuan";
import type { Task } from "@/core/models/Task";
import type { NotificationConfig, TaskEventPayload, TaskEventType, QueueItem } from "./types";
import { createTaskSnapshot } from "./types";
import {
  DEFAULT_NOTIFICATION_CONFIG,
  EVENT_DEDUPE_LIMIT,
  EVENT_QUEUE_INTERVAL_MS,
  EVENT_QUEUE_KEY,
  PLUGIN_EVENT_SOURCE,
  PLUGIN_EVENT_VERSION,
  SETTINGS_KEY,
} from "@/utils/constants";

const RETRY_BASE_DELAY_MS = 30 * 1000;
const RETRY_MAX_DELAY_MS = 30 * 60 * 1000;

type Fetcher = typeof fetch;

/**
 * EventService emits structured task events to n8n and manages retry queue.
 */
export class EventService {
  private plugin: Plugin;
  private config: NotificationConfig;
  private queue: QueueItem[] = [];
  private dedupeKeys: Set<string> = new Set();
  private flushIntervalId: number | null = null;
  private fetcher: Fetcher;

  constructor(plugin: Plugin, fetcher: Fetcher = fetch) {
    this.plugin = plugin;
    this.fetcher = fetcher;
    this.config = { ...DEFAULT_NOTIFICATION_CONFIG };
  }

  /**
   * Initialize the event service
   */
  async init(): Promise<void> {
    await this.loadConfig();
    await this.loadQueue();
    this.startQueueWorker();
  }

  /**
   * Load configuration from storage
   */
  private async loadConfig(): Promise<void> {
    try {
      const data = await this.plugin.loadData(SETTINGS_KEY);
      if (data) {
        this.config = { ...DEFAULT_NOTIFICATION_CONFIG, ...data };
      }
    } catch (err) {
      console.error("Failed to load event config:", err);
    }
  }

  /**
   * Save configuration to storage
   */
  async saveConfig(config: NotificationConfig): Promise<void> {
    this.config = config;
    await this.plugin.saveData(SETTINGS_KEY, config);
  }

  /**
   * Load queued events and dedupe keys from storage
   */
  private async loadQueue(): Promise<void> {
    try {
      const data = await this.plugin.loadData(EVENT_QUEUE_KEY);
      if (data) {
        this.queue = Array.isArray(data.queue) ? data.queue : [];
        const dedupe = Array.isArray(data.dedupeKeys) ? data.dedupeKeys : [];
        this.dedupeKeys = new Set(dedupe);
      }
    } catch (err) {
      console.error("Failed to load event queue:", err);
      this.queue = [];
      this.dedupeKeys = new Set();
    }
  }

  /**
   * Persist queue and dedupe keys
   */
  private async persistQueue(): Promise<void> {
    const dedupeKeys = Array.from(this.dedupeKeys).slice(-EVENT_DEDUPE_LIMIT);
    await this.plugin.saveData(EVENT_QUEUE_KEY, {
      queue: this.queue,
      dedupeKeys,
    });
  }

  /**
   * Start queue worker to retry failed events
   */
  private startQueueWorker(): void {
    if (this.flushIntervalId !== null) {
      return;
    }

    this.flushQueue();
    this.flushIntervalId = setInterval(() => {
      this.flushQueue();
    }, EVENT_QUEUE_INTERVAL_MS) as unknown as number;
  }

  /**
   * Stop queue worker
   */
  stopQueueWorker(): void {
    if (this.flushIntervalId !== null) {
      clearInterval(this.flushIntervalId);
      this.flushIntervalId = null;
    }
  }

  /**
   * Emit a task event to n8n
   */
  async emitTaskEvent(event: TaskEventType, task: Task): Promise<void> {
    if (!this.config.n8n.enabled || !this.config.n8n.webhookUrl) {
      return;
    }

    const dedupeKey = this.buildDedupeKey(event, task);
    if (this.isDuplicate(dedupeKey)) {
      return;
    }

    const payload = this.buildPayload(event, task, dedupeKey, 1);
    const success = await this.sendPayload(payload);

    if (success) {
      this.markDelivered(dedupeKey);
      await this.persistQueue();
    } else {
      this.enqueue(payload);
    }
  }

  /**
   * Test connection with n8n webhook
   */
  async testConnection(): Promise<boolean> {
    if (!this.config.n8n.enabled || !this.config.n8n.webhookUrl) {
      return false;
    }

    const dedupeKey = `test.ping:${new Date().toISOString()}`;
    const payload: TaskEventPayload = {
      event: "test.ping",
      source: PLUGIN_EVENT_SOURCE,
      version: PLUGIN_EVENT_VERSION,
      occurredAt: new Date().toISOString(),
      delivery: {
        dedupeKey,
        attempt: 1,
      },
    };

    return this.sendPayload(payload, true);
  }

  /**
   * Flush queued events
   */
  async flushQueue(): Promise<void> {
    if (!this.config.n8n.enabled || !this.config.n8n.webhookUrl) {
      return;
    }

    const now = Date.now();
    let updated = false;
    const remaining: QueueItem[] = [];

    for (const item of this.queue) {
      if (new Date(item.nextAttemptAt).getTime() > now) {
        remaining.push(item);
        continue;
      }

      const payload = {
        ...item.payload,
        delivery: {
          ...item.payload.delivery,
          attempt: item.attempt,
        },
      };

      const success = await this.sendPayload(payload);
      if (success) {
        this.markDelivered(payload.delivery.dedupeKey);
        updated = true;
      } else {
        const nextAttempt = item.attempt + 1;
        const nextDelay = this.getRetryDelay(nextAttempt);
        remaining.push({
          ...item,
          attempt: nextAttempt,
          nextAttemptAt: new Date(now + nextDelay).toISOString(),
        });
        updated = true;
      }
    }

    if (updated) {
      this.queue = remaining;
      await this.persistQueue();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): NotificationConfig {
    return { ...this.config };
  }

  private buildPayload(
    event: TaskEventType,
    task: Task,
    dedupeKey: string,
    attempt: number
  ): TaskEventPayload {
    return {
      event,
      source: PLUGIN_EVENT_SOURCE,
      version: PLUGIN_EVENT_VERSION,
      occurredAt: new Date().toISOString(),
      task: createTaskSnapshot(task),
      delivery: {
        dedupeKey,
        attempt,
      },
    };
  }

  private buildDedupeKey(event: TaskEventType, task: Task): string {
    const dueAtKey = new Date(task.dueAt).toISOString().slice(0, 16);
    return `${event}:${task.id}:${dueAtKey}`;
  }

  private isDuplicate(dedupeKey: string): boolean {
    if (this.dedupeKeys.has(dedupeKey)) {
      return true;
    }

    return this.queue.some(
      (item) => item.payload.delivery.dedupeKey === dedupeKey
    );
  }

  private markDelivered(dedupeKey: string): void {
    this.dedupeKeys.add(dedupeKey);
    if (this.dedupeKeys.size > EVENT_DEDUPE_LIMIT) {
      const keys = Array.from(this.dedupeKeys).slice(-EVENT_DEDUPE_LIMIT);
      this.dedupeKeys = new Set(keys);
    }
  }

  private enqueue(payload: TaskEventPayload): void {
    const now = Date.now();
    this.queue.push({
      id: `${payload.delivery.dedupeKey}:${payload.delivery.attempt}`,
      payload,
      attempt: payload.delivery.attempt,
      nextAttemptAt: new Date(now + this.getRetryDelay(payload.delivery.attempt)).toISOString(),
    });
    void this.persistQueue();
  }

  private getRetryDelay(attempt: number): number {
    const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
    return Math.min(delay, RETRY_MAX_DELAY_MS);
  }

  private async sendPayload(
    payload: TaskEventPayload,
    expectOkResponse = false
  ): Promise<boolean> {
    try {
      const response = await this.fetcher(this.config.n8n.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.config.n8n.sharedSecret
            ? { "X-Shehab-Note-Secret": this.config.n8n.sharedSecret }
            : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error("n8n webhook failed:", response.statusText);
        return false;
      }

      if (expectOkResponse) {
        const data = await response.json().catch(() => null);
        return Boolean(data && data.ok);
      }

      return true;
    } catch (error) {
      console.error("Failed to send n8n event:", error);
      return false;
    }
  }
}
