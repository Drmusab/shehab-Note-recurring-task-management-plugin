import { Router } from '../webhook/Router';
import { TaskCommandHandler, ITaskManager } from './handlers/TaskCommandHandler';
import { QueryCommandHandler, IStorageService } from './handlers/QueryCommandHandler';
import { TaskValidator } from './validation/TaskValidator';
import { RecurrenceLimitsConfig } from '../config/WebhookConfig';
import { WebhookError } from '../webhook/types/Error';

/**
 * Command registry - registers all command handlers
 */
export class CommandRegistry {
  private taskHandler: TaskCommandHandler;
  private queryHandler: QueryCommandHandler;

  constructor(
    private router: Router,
    taskManager: ITaskManager,
    storage: IStorageService,
    recurrenceLimits: RecurrenceLimitsConfig
  ) {
    const validator = new TaskValidator(recurrenceLimits);
    this.taskHandler = new TaskCommandHandler(taskManager, validator);
    this.queryHandler = new QueryCommandHandler(storage);

    this.registerCommands();
  }

  /**
   * Register all commands
   */
  private registerCommands(): void {
    // Task commands
    this.router.register('v1/tasks/create', async (command, data, context) => {
      const result = await this.taskHandler.handleCreate(data, context);
      if (result.status === 'error') {
        throw new WebhookError(
          result.error!.code as any,
          result.error!.message,
          result.error!.details
        );
      }
      return result.result;
    });

    this.router.register('v1/tasks/update', async (command, data, context) => {
      const result = await this.taskHandler.handleUpdate(data, context);
      if (result.status === 'error') {
        throw new WebhookError(
          result.error!.code as any,
          result.error!.message,
          result.error!.details
        );
      }
      return result.result;
    });

    this.router.register('v1/tasks/complete', async (command, data, context) => {
      const result = await this.taskHandler.handleComplete(data, context);
      if (result.status === 'error') {
        throw new WebhookError(
          result.error!.code as any,
          result.error!.message,
          result.error!.details
        );
      }
      return result.result;
    });

    this.router.register('v1/tasks/delete', async (command, data, context) => {
      const result = await this.taskHandler.handleDelete(data, context);
      if (result.status === 'error') {
        throw new WebhookError(
          result.error!.code as any,
          result.error!.message,
          result.error!.details
        );
      }
      return result.result;
    });

    this.router.register('v1/tasks/get', async (command, data, context) => {
      const result = await this.taskHandler.handleGet(data, context);
      if (result.status === 'error') {
        throw new WebhookError(
          result.error!.code as any,
          result.error!.message,
          result.error!.details
        );
      }
      return result.result;
    });

    // Query commands
    this.router.register('v1/query/list', async (command, data, context) => {
      const result = await this.queryHandler.handleList(data, context);
      if (result.status === 'error') {
        throw new WebhookError(
          result.error!.code as any,
          result.error!.message,
          result.error!.details
        );
      }
      return result.result;
    });
  }

  /**
   * Get task handler (for testing)
   */
  getTaskHandler(): TaskCommandHandler {
    return this.taskHandler;
  }

  /**
   * Get query handler (for testing)
   */
  getQueryHandler(): QueryCommandHandler {
    return this.queryHandler;
  }
}
