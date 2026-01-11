import type { Frequency } from "./Frequency";

/**
 * Alert payload types
 */
export interface AlertPayload {
  /** Plain text or Shehab-Note Block ID */
  note?: string;
  
  /** URL to audio or video media */
  media?: string;
  
  /** External reference link */
  link?: string;
}

/**
 * Task entity representing a recurring task
 */
export interface Task {
  /** Unique task identifier */
  id: string;
  
  /** Task title/name */
  name: string;
  
  /** Completion state (checked/unchecked) */
  status: boolean;
  
  /** Timestamp of last completion (ISO string) */
  lastCompletedAt: string | null;
  
  /** Current due date & time (ISO string) */
  dueAt: string;
  
  /** Recurrence rule definition */
  frequency: Frequency;
  
  /** Data sent to notification channels */
  alertPayload: AlertPayload;
  
  /** Whether task is active */
  enabled: boolean;
  
  /** Creation timestamp (ISO string) */
  createdAt: string;
  
  /** Last update timestamp (ISO string) */
  updatedAt: string;
}

/**
 * Creates a new task with default values
 */
export function createTask(
  name: string,
  frequency: Frequency,
  dueAt?: Date
): Task {
  const now = new Date().toISOString();
  const dueDate = dueAt || new Date();
  
  return {
    id: generateTaskId(),
    name,
    status: false,
    lastCompletedAt: null,
    dueAt: dueDate.toISOString(),
    frequency,
    alertPayload: {},
    enabled: true,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Generates a unique task ID
 */
function generateTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Type guard to check if an object is a valid Task
 */
export function isTask(obj: any): obj is Task {
  return (
    obj &&
    typeof obj.id === "string" &&
    typeof obj.name === "string" &&
    typeof obj.status === "boolean" &&
    typeof obj.dueAt === "string" &&
    typeof obj.enabled === "boolean" &&
    obj.frequency !== undefined
  );
}
