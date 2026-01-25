import { BaseCommandHandler } from './BaseCommandHandler';
import {
  CommandResult,
  CreateTaskData,
  UpdateTaskData,
  CompleteTaskData,
  DeleteTaskData,
  GetTaskData,
  Task,
} from '../types/CommandTypes';
import { TaskValidator } from '../validation/TaskValidator';
import { WebhookError } from '../../webhook/types/Error';

/**
 * Task manager interface (existing service)
 */
export interface ITaskManager {
  createTask(workspaceId: string, data: CreateTaskData): Promise<Task>;
  updateTask(workspaceId: string, data: UpdateTaskData): Promise<Task>;
  completeTask(workspaceId: string, data: CompleteTaskData): Promise<Task>;
  deleteTask(workspaceId: string, taskId: string, deleteHistory: boolean): Promise<void>;
  getTask(workspaceId: string, taskId: string, includeHistory: boolean): Promise<Task>;
  pauseTask(workspaceId: string, taskId: string): Promise<Task>;
  resumeTask(workspaceId: string, taskId: string): Promise<Task>;
}

/**
 * Task command handler
 */
export class TaskCommandHandler extends BaseCommandHandler {
  constructor(
    private taskManager: ITaskManager,
    private validator: TaskValidator
  ) {
    super();
  }

  /**
   * Handle: v1/tasks/create
   */
  async handleCreate(data: CreateTaskData, context: any): Promise<CommandResult> {
    try {
      // Validate input
      this.validator.validateCreateTask(data);

      // Create task via TaskManager
      const task = await this.taskManager.createTask(context.workspaceId, data);

      return this.success({
        taskId: task.taskId,
        createdAt: task.createdAt,
        nextDueDate: task.nextDueDate,
        status: task.status,
      });
    } catch (error) {
      if (error instanceof WebhookError) {
        return this.fromWebhookError(error);
      }
      return this.error('INTERNAL_ERROR', 'Failed to create task');
    }
  }

  /**
   * Handle: v1/tasks/update
   */
  async handleUpdate(data: UpdateTaskData, context: any): Promise<CommandResult> {
    try {
      // Validate input
      this.validator.validateUpdateTask(data);

      // Update task via TaskManager
      const task = await this.taskManager.updateTask(context.workspaceId, data);

      return this.success({
        taskId: task.taskId,
        updatedAt: task.updatedAt,
        status: task.status,
      });
    } catch (error) {
      if (error instanceof WebhookError) {
        return this.fromWebhookError(error);
      }
      return this.error('INTERNAL_ERROR', 'Failed to update task');
    }
  }

  /**
   * Handle: v1/tasks/complete
   */
  async handleComplete(data: CompleteTaskData, context: any): Promise<CommandResult> {
    try {
      // Validate task ID
      const validation = this.validateRequired(data, ['taskId']);
      if (!validation.valid) {
        throw new WebhookError('VALIDATION_ERROR', 'taskId is required', {
          missing: validation.missing,
        });
      }

      // Validate completion timestamp if provided
      if (data.completionTimestamp && !this.validateISO8601(data.completionTimestamp)) {
        throw new WebhookError('VALIDATION_ERROR', 'completionTimestamp must be ISO-8601 format');
      }

      // Complete task via TaskManager
      const task = await this.taskManager.completeTask(context.workspaceId, data);

      // Build response based on whether task is recurring
      const response: any = {
        taskId: task.taskId,
        completedAt: task.completedAt,
      };

      if (task.recurrencePattern) {
        response.nextOccurrence = {
          dueDate: task.nextDueDate,
          status: task.status,
        };
      } else {
        response.status = task.status;
      }

      return this.success(response);
    } catch (error) {
      if (error instanceof WebhookError) {
        return this.fromWebhookError(error);
      }
      return this.error('INTERNAL_ERROR', 'Failed to complete task');
    }
  }

  /**
   * Handle: v1/tasks/delete
   */
  async handleDelete(data: DeleteTaskData, context: any): Promise<CommandResult> {
    try {
      // Validate task ID
      const validation = this.validateRequired(data, ['taskId']);
      if (!validation.valid) {
        throw new WebhookError('VALIDATION_ERROR', 'taskId is required');
      }

      // Delete task via TaskManager
      await this.taskManager.deleteTask(
        context.workspaceId,
        data.taskId,
        data.deleteHistory ?? false
      );

      return this.success({
        taskId: data.taskId,
        deletedAt: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof WebhookError) {
        return this.fromWebhookError(error);
      }
      return this.error('INTERNAL_ERROR', 'Failed to delete task');
    }
  }

  /**
   * Handle: v1/tasks/get
   */
  async handleGet(data: GetTaskData, context: any): Promise<CommandResult> {
    try {
      // Validate task ID
      const validation = this.validateRequired(data, ['taskId']);
      if (!validation.valid) {
        throw new WebhookError('VALIDATION_ERROR', 'taskId is required');
      }

      // Get task via TaskManager
      const task = await this.taskManager.getTask(
        context.workspaceId,
        data.taskId,
        data.includeHistory ?? false
      );

      return this.success(task);
    } catch (error) {
      if (error instanceof WebhookError) {
        return this.fromWebhookError(error);
      }
      return this.error('INTERNAL_ERROR', 'Failed to retrieve task');
    }
  }
}
