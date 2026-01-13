import type { Task } from "@/core/models/Task";
import type { ArchiveQuery } from "@/core/storage/ArchiveTaskStore";
import type { TaskStorage } from "@/core/storage/TaskStorage";

export interface TaskRepositoryProvider {
  getAllTasks(): Task[];
  getTask(id: string): Task | undefined;
  getTaskByBlockId(blockId: string): Task | undefined;
  getEnabledTasks(): Task[];
  getTasksDueOnOrBefore(date: Date): Task[];
  getTodayAndOverdueTasks(): Task[];
  getTasksInRange(startDate: Date, endDate: Date): Task[];
  saveTask(task: Task): Promise<void>;
  deleteTask(taskId: string): Promise<void>;
  archiveTask(task: Task): Promise<void>;
  loadArchive(filter?: ArchiveQuery): Promise<Task[]>;
  flush(): Promise<void>;
}

export class TaskRepository implements TaskRepositoryProvider {
  constructor(private readonly storage: TaskStorage) {}

  getAllTasks(): Task[] {
    return this.storage.getAllTasks();
  }

  getTask(id: string): Task | undefined {
    return this.storage.getTask(id);
  }

  getTaskByBlockId(blockId: string): Task | undefined {
    return this.storage.getTaskByBlockId(blockId);
  }

  getEnabledTasks(): Task[] {
    return this.storage.getEnabledTasks();
  }

  getTasksDueOnOrBefore(date: Date): Task[] {
    return this.storage.getTasksDueOnOrBefore(date);
  }

  getTodayAndOverdueTasks(): Task[] {
    return this.storage.getTodayAndOverdueTasks();
  }

  getTasksInRange(startDate: Date, endDate: Date): Task[] {
    return this.storage.getTasksInRange(startDate, endDate);
  }

  async saveTask(task: Task): Promise<void> {
    await this.storage.saveTask(task);
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.storage.deleteTask(taskId);
  }

  async archiveTask(task: Task): Promise<void> {
    await this.storage.archiveTask(task);
  }

  async loadArchive(filter?: ArchiveQuery): Promise<Task[]> {
    return this.storage.loadArchive(filter);
  }

  async flush(): Promise<void> {
    await this.storage.flush();
  }
}
