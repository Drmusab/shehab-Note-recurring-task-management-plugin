import type { Task } from "@/core/models/Task";
import type { TaskStorage } from "@/core/storage/TaskStorage";
import { RecurrenceEngine } from "./RecurrenceEngine";
import { SCHEDULER_INTERVAL_MS } from "@/utils/constants";

/**
 * Scheduler manages task timing and triggers notifications
 */
export class Scheduler {
  private storage: TaskStorage;
  private recurrenceEngine: RecurrenceEngine;
  private intervalId: number | null = null;
  private onTaskDue: ((task: Task) => void) | null = null;
  private notifiedTasks: Set<string> = new Set();

  constructor(storage: TaskStorage) {
    this.storage = storage;
    this.recurrenceEngine = new RecurrenceEngine();
  }

  /**
   * Start the scheduler
   */
  start(onTaskDue: (task: Task) => void): void {
    this.onTaskDue = onTaskDue;
    this.checkDueTasks(); // Check immediately
    
    // Use type assertion for cross-platform compatibility
    this.intervalId = setInterval(() => {
      this.checkDueTasks();
    }, SCHEDULER_INTERVAL_MS) as unknown as number;
    
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
   * Check for tasks that are due and trigger notifications
   */
  private checkDueTasks(): void {
    const now = new Date();
    const tasks = this.storage.getEnabledTasks();

    for (const task of tasks) {
      const dueDate = new Date(task.dueAt);
      
      // Check if task is due (within the current minute)
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
    task.status = false; // Reset to unchecked
    
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
   * Get recurrence engine for external use
   */
  getRecurrenceEngine(): RecurrenceEngine {
    return this.recurrenceEngine;
  }
}
