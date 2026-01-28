import type { Task as RecurringTask } from '@/core/models/Task';
import type { Task as ObsidianTask } from '@/vendor/obsidian-tasks/types/Task';
import type { Status } from '@/vendor/obsidian-tasks/types/Status';
import { StatusImpl, StatusRegistry } from '@/vendor/obsidian-tasks/types/Status';
import { taskFromLine, Priority, TaskDate } from '@/vendor/obsidian-tasks/types/Task';

export interface EditTaskProps {
  task: ObsidianTask;
  onSubmit: (updatedTasks: ObsidianTask[]) => void | Promise<void>;
  statusOptions: Status[];
  allTasks: ObsidianTask[];
}

/**
 * Bridges Obsidian-Tasks UI to recurring-task-management data model
 */
export class ObsidianTasksUIBridge {
  /**
   * Convert recurring Task → Obsidian Task for UI display
   */
  static toObsidianTask(task: RecurringTask): ObsidianTask {
    const obsidianTask: ObsidianTask = {
      description: task.name,
      status: this.getStatusFromTask(task),
      priority: this.getPrioritySymbol(task.priority || 'normal'),
      dueDate: task.dueAt ? new Date(task.dueAt).toISOString().split('T')[0] : null,
      scheduledDate: task.scheduledAt ? new Date(task.scheduledAt).toISOString().split('T')[0] : null,
      startDate: task.startAt ? new Date(task.startAt).toISOString().split('T')[0] : null,
      createdDate: task.createdAt ? new Date(task.createdAt).toISOString().split('T')[0] : null,
      doneDate: task.doneAt || task.completedAt ? new Date(task.doneAt || task.completedAt!).toISOString().split('T')[0] : null,
      cancelledDate: task.cancelledAt ? new Date(task.cancelledAt).toISOString().split('T')[0] : null,
      recurrence: this.frequencyToRRule(task.frequency),
      dependsOn: task.dependsOn || [],
      id: task.id,
      path: task.path || '',
      
      // Add TaskDate properties for compatibility
      due: TaskDate.fromString(task.dueAt ? new Date(task.dueAt).toISOString().split('T')[0] : null),
      scheduled: TaskDate.fromString(task.scheduledAt ? new Date(task.scheduledAt).toISOString().split('T')[0] : null),
      start: TaskDate.fromString(task.startAt ? new Date(task.startAt).toISOString().split('T')[0] : null),
      created: TaskDate.fromString(task.createdAt ? new Date(task.createdAt).toISOString().split('T')[0] : null),
      done: TaskDate.fromString(task.doneAt || task.completedAt ? new Date(task.doneAt || task.completedAt!).toISOString().split('T')[0] : null),
      cancelled: TaskDate.fromString(task.cancelledAt ? new Date(task.cancelledAt).toISOString().split('T')[0] : null),
      recurrenceRule: this.frequencyToRRule(task.frequency) || undefined,
      
      // Add handleNewStatus method
      handleNewStatus: (newStatus: Status) => {
        const now = new Date().toISOString().split('T')[0];
        const updatedTask = { ...obsidianTask, status: newStatus };
        
        if (newStatus.isCompleted()) {
          updatedTask.doneDate = now;
          updatedTask.done = TaskDate.fromString(now);
        }
        
        if (newStatus.isCancelled()) {
          updatedTask.cancelledDate = now;
          updatedTask.cancelled = TaskDate.fromString(now);
        }
        
        return [updatedTask];
      },
    };
    
    return obsidianTask;
  }

  /**
   * Convert Obsidian Task → recurring Task for storage
   */
  static fromObsidianTask(obsidianTask: ObsidianTask, originalTask?: RecurringTask): RecurringTask {
    const now = new Date().toISOString();
    
    return {
      id: originalTask?.id || obsidianTask.id,
      name: obsidianTask.description,
      dueAt: obsidianTask.dueDate ? new Date(obsidianTask.dueDate).toISOString() : now,
      frequency: this.rRuleToFrequency(obsidianTask.recurrence || obsidianTask.recurrenceRule),
      priority: this.normalizePriority(obsidianTask.priority) as any,
      dependsOn: obsidianTask.dependsOn || [],
      enabled: obsidianTask.status.type === 'TODO',
      completedAt: obsidianTask.doneDate ? new Date(obsidianTask.doneDate).toISOString() : undefined,
      doneAt: obsidianTask.doneDate ? new Date(obsidianTask.doneDate).toISOString() : undefined,
      cancelledAt: obsidianTask.cancelledDate ? new Date(obsidianTask.cancelledDate).toISOString() : undefined,
      scheduledAt: obsidianTask.scheduledDate ? new Date(obsidianTask.scheduledDate).toISOString() : undefined,
      startAt: obsidianTask.startDate ? new Date(obsidianTask.startDate).toISOString() : undefined,
      createdAt: obsidianTask.createdDate ? new Date(obsidianTask.createdDate).toISOString() : originalTask?.createdAt || now,
      updatedAt: now,
      timezone: originalTask?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      completionCount: originalTask?.completionCount || 0,
      missCount: originalTask?.missCount || 0,
      currentStreak: originalTask?.currentStreak || 0,
      bestStreak: originalTask?.bestStreak || 0,
      recentCompletions: originalTask?.recentCompletions || [],
      snoozeCount: originalTask?.snoozeCount || 0,
      maxSnoozes: originalTask?.maxSnoozes || 3,
      version: originalTask?.version || 1,
      status: this.mapObsidianStatusToRecurringStatus(obsidianTask.status),
      path: obsidianTask.path || originalTask?.path,
    };
  }

  /**
   * Create empty task for new task creation
   */
  static createEmptyTask(): ObsidianTask {
    return taskFromLine({ line: '', path: '' });
  }

  /**
   * Get status options for dropdown
   */
  static getStatusOptions(): Status[] {
    return StatusRegistry.getInstance().registeredStatuses;
  }

  private static getStatusFromTask(task: RecurringTask): Status {
    if (task.completedAt || task.doneAt) {
      return new StatusImpl('x', 'Done', 'DONE');
    }
    if (task.cancelledAt) {
      return new StatusImpl('-', 'Cancelled', 'CANCELLED');
    }
    return new StatusImpl(' ', 'Todo', 'TODO');
  }

  private static getPrioritySymbol(priority: string): Priority {
    const map: Record<string, Priority> = {
      'highest': Priority.Highest,
      'high': Priority.High,
      'medium': Priority.Medium,
      'normal': Priority.Normal,
      'low': Priority.Low,
      'lowest': Priority.Lowest,
    };
    return map[priority.toLowerCase()] || Priority.Normal;
  }

  private static normalizePriority(priority: string | Priority): string {
    if (typeof priority === 'string') {
      if (priority === Priority.Highest || priority === '⏫') return 'highest';
      if (priority === Priority.High || priority === '🔺') return 'high';
      if (priority === Priority.Medium || priority === '🔼') return 'medium';
      if (priority === Priority.Low || priority === '🔽') return 'low';
      if (priority === Priority.Lowest || priority === '⏬') return 'lowest';
    }
    return 'normal';
  }

  private static frequencyToRRule(frequency: any): string | null {
    if (!frequency) return null;
    
    // Simple conversion - expand this later for full RRule support
    const { type, interval } = frequency;
    
    if (type === 'daily') {
      return interval === 1 ? 'every day' : `every ${interval} days`;
    } else if (type === 'weekly') {
      return interval === 1 ? 'every week' : `every ${interval} weeks`;
    } else if (type === 'monthly') {
      return interval === 1 ? 'every month' : `every ${interval} months`;
    } else if (type === 'yearly') {
      return interval === 1 ? 'every year' : `every ${interval} years`;
    }
    
    return `every ${interval} ${type}`;
  }

  private static rRuleToFrequency(rrule: string | null | undefined): any {
    if (!rrule) {
      // Default to daily if no recurrence specified
      return {
        type: 'daily' as const,
        interval: 1,
      };
    }
    
    // Simple parsing - expand this later for full RRule support
    const lower = rrule.toLowerCase();
    
    if (lower.includes('day')) {
      const match = lower.match(/every (\d+) days?/);
      return {
        type: 'daily' as const,
        interval: match ? parseInt(match[1]) : 1,
      };
    } else if (lower.includes('week')) {
      const match = lower.match(/every (\d+) weeks?/);
      return {
        type: 'weekly' as const,
        interval: match ? parseInt(match[1]) : 1,
      };
    } else if (lower.includes('month')) {
      const match = lower.match(/every (\d+) months?/);
      return {
        type: 'monthly' as const,
        interval: match ? parseInt(match[1]) : 1,
      };
    } else if (lower.includes('year')) {
      const match = lower.match(/every (\d+) years?/);
      return {
        type: 'yearly' as const,
        interval: match ? parseInt(match[1]) : 1,
      };
    }
    
    return {
      type: 'daily' as const,
      interval: 1,
    };
  }

  private static mapObsidianStatusToRecurringStatus(status: Status): 'todo' | 'done' | 'cancelled' {
    if (status.type === 'DONE') return 'done';
    if (status.type === 'CANCELLED') return 'cancelled';
    return 'todo';
  }
}
