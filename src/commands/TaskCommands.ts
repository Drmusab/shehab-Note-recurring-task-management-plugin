/**
 * Task Commands for keyboard shortcuts and actions
 */

import type { Task } from "@/core/models/Task";
import type { TaskRepositoryProvider } from "@/core/storage/TaskRepository";
import type { RecurrenceEngine } from "@/core/engine/RecurrenceEngine";
import { StatusRegistry } from "@/core/models/StatusRegistry";
import { pluginEventBus } from "@/core/events/PluginEventBus";
import * as logger from "@/utils/logger";
import { toast } from "@/utils/notifications";

export class TaskCommands {
  constructor(
    private repository: TaskRepositoryProvider,
    private recurrenceEngine?: RecurrenceEngine
  ) {}

  /**
   * Toggle task status - cycle through status types
   */
  async toggleStatus(taskId: string): Promise<void> {
    try {
      const task = this.repository.getTask(taskId);
      if (!task) {
        toast.error("Task not found");
        return;
      }

      const registry = StatusRegistry.getInstance();
      const currentSymbol = task.statusSymbol || " ";
      const nextSymbol = registry.getNextSymbol(currentSymbol);
      
      // Update task
      const updatedTask = { ...task, statusSymbol: nextSymbol };
      const newStatus = registry.getStatus(nextSymbol);
      
      // Update status field based on type
      if (newStatus.type === "DONE") {
        updatedTask.status = "done";
        updatedTask.doneAt = new Date().toISOString();
        
        // Handle recurrence if needed
        if (task.frequency && this.recurrenceEngine) {
          await this.handleRecurrence(updatedTask);
        }
      } else if (newStatus.type === "CANCELLED") {
        updatedTask.status = "cancelled";
        updatedTask.cancelledAt = new Date().toISOString();
      } else if (newStatus.type === "TODO") {
        updatedTask.status = "todo";
      }
      
      await this.repository.saveTask(updatedTask);
      pluginEventBus.emit("task:updated", { taskId });
      toast.success(`Task status updated to ${newStatus.name}`);
    } catch (error) {
      logger.error("Failed to toggle task status", error);
      toast.error("Failed to toggle status");
    }
  }

  /**
   * Complete a task (mark as done)
   */
  async completeTask(taskId: string): Promise<void> {
    try {
      const task = this.repository.getTask(taskId);
      if (!task) {
        toast.error("Task not found");
        return;
      }

      const updatedTask = {
        ...task,
        status: "done" as const,
        doneAt: new Date().toISOString(),
      };

      await this.repository.saveTask(updatedTask);
      
      // Handle recurrence if needed
      if (task.frequency && this.recurrenceEngine) {
        await this.handleRecurrence(updatedTask);
      }
      
      pluginEventBus.emit("task:complete", { taskId });
      toast.success(`Task "${task.name}" completed`);
    } catch (error) {
      logger.error("Failed to complete task", error);
      toast.error("Failed to complete task");
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<void> {
    try {
      const task = this.repository.getTask(taskId);
      if (!task) {
        toast.error("Task not found");
        return;
      }

      // Check for dependencies
      const allTasks = this.repository.getAllTasks();
      const dependents = allTasks.filter((t) => 
        t.blockedBy?.includes(taskId) || t.dependsOn?.includes(taskId)
      );

      if (dependents.length > 0) {
        const confirmed = confirm(
          `This task is blocking ${dependents.length} other task(s). Are you sure you want to delete it?`
        );
        if (!confirmed) {
          return;
        }
      }

      await this.repository.deleteTask(taskId);
      pluginEventBus.emit("task:deleted", { taskId });
      toast.success(`Task "${task.name}" deleted`);
    } catch (error) {
      logger.error("Failed to delete task", error);
      toast.error("Failed to delete task");
    }
  }

  /**
   * Reschedule task to today
   */
  async rescheduleToToday(taskId: string): Promise<void> {
    try {
      const task = this.repository.getTask(taskId);
      if (!task) {
        toast.error("Task not found");
        return;
      }

      const today = new Date();
      today.setHours(12, 0, 0, 0);
      
      const updatedTask = {
        ...task,
        scheduledAt: today.toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await this.repository.saveTask(updatedTask);
      pluginEventBus.emit("task:updated", { taskId });
      toast.success(`Task rescheduled to today`);
    } catch (error) {
      logger.error("Failed to reschedule task", error);
      toast.error("Failed to reschedule task");
    }
  }

  /**
   * Defer task by N days
   */
  async deferTask(taskId: string, days: number): Promise<void> {
    try {
      const task = this.repository.getTask(taskId);
      if (!task) {
        toast.error("Task not found");
        return;
      }

      const updatedTask = { ...task, updatedAt: new Date().toISOString() };

      // Defer due date if it exists
      if (task.dueAt) {
        const newDue = new Date(task.dueAt);
        newDue.setDate(newDue.getDate() + days);
        updatedTask.dueAt = newDue.toISOString();
      }

      // Defer scheduled date if it exists
      if (task.scheduledAt) {
        const newScheduled = new Date(task.scheduledAt);
        newScheduled.setDate(newScheduled.getDate() + days);
        updatedTask.scheduledAt = newScheduled.toISOString();
      }

      await this.repository.saveTask(updatedTask);
      pluginEventBus.emit("task:updated", { taskId });
      toast.success(`Task deferred by ${days} day${days !== 1 ? "s" : ""}`);
    } catch (error) {
      logger.error("Failed to defer task", error);
      toast.error("Failed to defer task");
    }
  }

  /**
   * Handle recurrence when task is completed
   */
  private async handleRecurrence(task: Task): Promise<void> {
    if (!task.frequency || !this.recurrenceEngine) {
      return;
    }

    try {
      // Generate next task instance
      const nextTask = this.recurrenceEngine.calculateNext(task);
      
      // Handle onCompletion action
      if (task.onCompletion === "delete") {
        // Delete the current task
        await this.repository.deleteTask(task.id);
      }
      
      // Create next instance
      await this.repository.saveTask(nextTask);
      logger.info(`Created next recurrence for task: ${task.name}`);
      toast.info(`Next occurrence scheduled`);
    } catch (error) {
      logger.error("Failed to handle recurrence", error);
      toast.error("Failed to create next recurrence");
    }
  }
}
