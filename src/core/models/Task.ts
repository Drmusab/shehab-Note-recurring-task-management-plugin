import type { Frequency } from "./Frequency";

/**
 * Task entity representing a recurring task
 */
export interface Task {
  /** Unique task identifier */
  id: string;
  
  /** Task title/name */
  name: string;
  
  /** Timestamp of last completion (ISO string) */
  lastCompletedAt?: string;
  
  /** Current due date & time (ISO string) */
  dueAt: string;
  
  /** Recurrence rule definition */
  frequency: Frequency;
  
  /** Whether task is active */
  enabled: boolean;

  /** Linked block ID in Shehab-Note */
  linkedBlockId?: string;

  /** Priority for routing */
  priority?: "low" | "normal" | "high";

  /** Tags for routing */
  tags?: string[];
  
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
    lastCompletedAt: undefined,
    dueAt: dueDate.toISOString(),
    frequency,
    enabled: true,
    priority: "normal",
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
    typeof obj.dueAt === "string" &&
    typeof obj.enabled === "boolean" &&
    obj.frequency !== undefined
  );
}
