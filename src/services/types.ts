import type { Frequency } from "@/core/models/Frequency";
import type { Task } from "@/core/models/Task";

export type TaskEventType =
  | "task.due"
  | "task.completed"
  | "task.snoozed"
  | "task.skipped"
  | "task.missed"
  | "test.ping";

/**
 * Configuration for n8n webhook
 */
export interface N8nConfig {
  webhookUrl: string;
  sharedSecret: string;
  enabled: boolean;
}

/**
 * All notification configuration
 */
export interface NotificationConfig {
  n8n: N8nConfig;
}

export interface EventDelivery {
  dedupeKey: string;
  attempt: number;
}

export interface TaskSnapshot {
  id: string;
  name: string;
  dueAt: string;
  frequency: Frequency;
  linkedBlockId?: string;
  priority?: "low" | "normal" | "high";
  tags?: string[];
}

export interface TaskEventPayload {
  event: TaskEventType;
  source: string;
  version: string;
  occurredAt: string;
  task?: TaskSnapshot;
  delivery: EventDelivery;
}

export interface QueueItem {
  id: string;
  payload: TaskEventPayload;
  attempt: number;
  nextAttemptAt: string;
}

export function createTaskSnapshot(task: Task): TaskSnapshot {
  return {
    id: task.id,
    name: task.name,
    dueAt: task.dueAt,
    frequency: task.frequency,
    linkedBlockId: task.linkedBlockId,
    priority: task.priority,
    tags: task.tags,
  };
}
