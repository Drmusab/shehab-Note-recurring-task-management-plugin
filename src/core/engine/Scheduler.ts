import type { Task } from "@/core/models/Task";
import type { TaskStorage } from "@/core/storage/TaskStorage";
import { RecurrenceEngine } from "./RecurrenceEngine";
import { MISSED_GRACE_PERIOD_MS, SCHEDULER_INTERVAL_MS } from "@/utils/constants";

/**
 * Scheduler manages task timing and triggers notifications
 */
export class Scheduler {
  private storage: TaskStorage;
  private recurrenceEngine: RecurrenceEngine;
  private intervalId: number | null = null;
  private onTaskDue: ((task: Task) => void) | null = null;
  private onTaskMissed: ((task: Task) => void) | null = null;
  private notifiedTasks: Set<string> = new Set();
  private missedTasks: Set<string> = new Set();
  private intervalMs: number;

  constructor(storage: TaskStorage, intervalMs: number = SCHEDULER_INTERVAL_MS) {
    this.storage = storage;
    this.recurrenceEngine = new RecurrenceEngine();
    this.intervalMs = intervalMs;
  }

  /**
   * Start the scheduler
   */
  start(
    onTaskDue: (task: Task) => void,
    onTaskMissed?: (task: Task) => void
  ): void {
    this.onTaskDue = onTaskDue;
    this.onTaskMissed = onTaskMissed ?? null;
    this.checkDueTasks(); // Check immediately
    
    // Use type assertion for cross-platform compatibility
    this.intervalId = setInterval(() => {
      this.checkDueTasks();
    }, this.intervalMs) as unknown as number;
    
    console.log("Scheduler started");
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("Scheduler stopped");
    }
  }

  /**
   * Run the scheduler check once (useful for tests)
   */
  runOnce(): void {
    this.checkDueTasks();
  }

  /**
   * Check for tasks that are due and trigger notifications
   */
  private checkDueTasks(): void {
    const now = new Date();
    const tasks = this.storage.getEnabledTasks();

    for (const task of tasks) {
      const dueDate = new Date(task.dueAt);
      
      // Check if task is due
      const isDue = dueDate <= now;
      const taskKey = `${task.id}-${task.dueAt}`;
      
      if (isDue && !this.notifiedTasks.has(taskKey)) {
        // Trigger notification
        if (this.onTaskDue) {
          this.onTaskDue(task);
        }
        
        // Mark as notified for this occurrence
        this.notifiedTasks.add(taskKey);
        
        // Clean up old notification records (keep last 1000)
        if (this.notifiedTasks.size > 1000) {
          const toDelete = Array.from(this.notifiedTasks).slice(0, 100);
          toDelete.forEach(key => this.notifiedTasks.delete(key));
        }
      }

      const lastCompletedAt = task.lastCompletedAt
        ? new Date(task.lastCompletedAt)
        : null;

      if (
        isDue &&
        this.onTaskMissed &&
        now.getTime() - dueDate.getTime() >= MISSED_GRACE_PERIOD_MS &&
        !this.missedTasks.has(taskKey) &&
        (!lastCompletedAt || lastCompletedAt < dueDate)
      ) {
        this.onTaskMissed(task);
        this.missedTasks.add(taskKey);

        if (this.missedTasks.size > 1000) {
          const toDelete = Array.from(this.missedTasks).slice(0, 100);
          toDelete.forEach((key) => this.missedTasks.delete(key));
        }
      }
    }
  }

  /**
   * Mark a task as done and reschedule
   */
  async markTaskDone(taskId: string): Promise<void> {
    const task = this.storage.getTask(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    // Save completion time
    task.lastCompletedAt = new Date().toISOString();

    // Calculate next occurrence
    const currentDue = new Date(task.dueAt);
    const nextDue = this.recurrenceEngine.calculateNext(
      currentDue,
      task.frequency
    );

    // Update task
    task.dueAt = nextDue.toISOString();
    await this.storage.saveTask(task);
    console.log(`Task "${task.name}" rescheduled to ${nextDue.toISOString()}`);
  }

  /**
   * Delay a task to tomorrow
   */
  async delayTaskToTomorrow(taskId: string): Promise<void> {
    const task = this.storage.getTask(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const currentDue = new Date(task.dueAt);
    const tomorrow = new Date(currentDue);
    tomorrow.setDate(tomorrow.getDate() + 1);

    task.dueAt = tomorrow.toISOString();
    await this.storage.saveTask(task);
    console.log(`Task "${task.name}" delayed to ${tomorrow.toISOString()}`);
  }

  /**
   * Skip a task occurrence and reschedule to next recurrence
   */
  async skipTaskOccurrence(taskId: string): Promise<void> {
    const task = this.storage.getTask(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const currentDue = new Date(task.dueAt);
    const nextDue = this.recurrenceEngine.calculateNext(
      currentDue,
      task.frequency
    );

    task.dueAt = nextDue.toISOString();
    await this.storage.saveTask(task);
    console.log(`Task "${task.name}" skipped to ${nextDue.toISOString()}`);
  }

  /**
   * Get recurrence engine for external use
   */
  getRecurrenceEngine(): RecurrenceEngine {
    return this.recurrenceEngine;
  }
}
