/** @vitest-environment jsdom */
import { describe, expect, it, beforeEach, vi } from "vitest";
import { handleCreateTaskFromBlock } from "@/commands/CreateTaskFromBlock";
import type { Task } from "@/core/models/Task";
import type { TaskRepositoryProvider } from "@/core/storage/TaskRepository";
import type { SiYuanBlockAPI } from "@/core/api/SiYuanApiAdapter";

// Mock the dependencies
vi.mock("@/utils/logger", () => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));

vi.mock("@/utils/notifications", () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock getCurrentBlockContent
vi.mock("@/commands/BlockHandler", () => ({
  getCurrentBlockContent: vi.fn(),
}));

import { getCurrentBlockContent } from "@/commands/BlockHandler";

function createMockRepository(): TaskRepositoryProvider {
  const tasks = new Map<string, Task>();

  return {
    getAllTasks: () => Array.from(tasks.values()),
    getTask: (id: string) => tasks.get(id),
    getTaskByBlockId: (blockId: string) => {
      return Array.from(tasks.values()).find(t => t.linkedBlockId === blockId);
    },
    getEnabledTasks: () => Array.from(tasks.values()).filter((t) => t.enabled),
    getTasksDueOnOrBefore: (date: Date) => [],
    getTodayAndOverdueTasks: () => [],
    getTasksInRange: (startDate: Date, endDate: Date) => [],
    saveTask: async (task: Task) => {
      tasks.set(task.id, task);
      return task;
    },
    deleteTask: async (taskId: string) => {
      tasks.delete(taskId);
    },
    archiveTask: async (task: Task) => {},
    loadArchive: async () => [],
    flush: async () => {},
  };
}

function createMockBlockAPI(): SiYuanBlockAPI {
  return {
    setBlockAttrs: vi.fn().mockResolvedValue(undefined),
  };
}

describe("CreateTaskFromBlock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create task from valid checklist block", async () => {
    const mockRepository = createMockRepository();
    const mockBlockAPI = createMockBlockAPI();
    let capturedTask: Task | undefined;

    const mockOpenEditor = vi.fn((task) => {
      capturedTask = task;
    });

    // Mock a valid checklist block
    vi.mocked(getCurrentBlockContent).mockReturnValue({
      blockId: "block-123",
      content: "- [ ] Buy milk 📅 2026-01-25 🔼",
      isChecklist: true,
    });

    await handleCreateTaskFromBlock({
      repository: mockRepository,
      blockApi: mockBlockAPI,
      openTaskEditor: mockOpenEditor,
    });

    // Verify editor was opened with task
    expect(mockOpenEditor).toHaveBeenCalled();
    expect(capturedTask).toBeDefined();
    expect(capturedTask?.name).toBe("Buy milk");
    expect(capturedTask?.linkedBlockId).toBe("block-123");
  });

  it("should auto-promote plain text to checklist", async () => {
    const mockRepository = createMockRepository();
    const mockBlockAPI = createMockBlockAPI();
    let capturedTask: Task | undefined;

    const mockOpenEditor = vi.fn((task) => {
      capturedTask = task;
    });

    // Mock plain text block (not a checklist)
    vi.mocked(getCurrentBlockContent).mockReturnValue({
      blockId: "block-456",
      content: "Buy groceries",
      isChecklist: false,
    });

    await handleCreateTaskFromBlock({
      repository: mockRepository,
      blockApi: mockBlockAPI,
      openTaskEditor: mockOpenEditor,
    });

    // Should still open editor with task
    expect(mockOpenEditor).toHaveBeenCalled();
    expect(capturedTask).toBeDefined();
    expect(capturedTask?.name).toBe("Buy groceries");
  });

  it("should handle parse errors gracefully", async () => {
    const mockRepository = createMockRepository();
    const mockBlockAPI = createMockBlockAPI();
    const mockOpenEditor = vi.fn();

    // Mock a block with invalid date syntax
    vi.mocked(getCurrentBlockContent).mockReturnValue({
      blockId: "block-789",
      content: "- [ ] Task 📅 invaliddate",
      isChecklist: true,
    });

    await handleCreateTaskFromBlock({
      repository: mockRepository,
      blockApi: mockBlockAPI,
      openTaskEditor: mockOpenEditor,
    });

    // Should still open editor even with parse error
    expect(mockOpenEditor).toHaveBeenCalled();
  });

  it("should show error when no block is selected", async () => {
    const mockRepository = createMockRepository();
    const mockBlockAPI = createMockBlockAPI();
    const mockOpenEditor = vi.fn();

    // Mock no block selection
    vi.mocked(getCurrentBlockContent).mockReturnValue(null);

    await handleCreateTaskFromBlock({
      repository: mockRepository,
      blockApi: mockBlockAPI,
      openTaskEditor: mockOpenEditor,
    });

    // Should NOT open editor
    expect(mockOpenEditor).not.toHaveBeenCalled();
  });

  it("should edit existing task when block already has task", async () => {
    const mockRepository = createMockRepository();
    const mockBlockAPI = createMockBlockAPI();
    let capturedTask: Task | undefined;

    // Create an existing task linked to the block
    const existingTask: Task = {
      id: "task-001",
      name: "Original task",
      dueAt: new Date().toISOString(),
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "todo",
      linkedBlockId: "block-999",
    };
    await mockRepository.saveTask(existingTask);

    const mockOpenEditor = vi.fn((task) => {
      capturedTask = task;
    });

    // Mock block with existing task
    vi.mocked(getCurrentBlockContent).mockReturnValue({
      blockId: "block-999",
      content: "- [ ] Updated task 📅 2026-01-26",
      isChecklist: true,
    });

    await handleCreateTaskFromBlock({
      repository: mockRepository,
      blockApi: mockBlockAPI,
      openTaskEditor: mockOpenEditor,
    });

    // Should open editor with updated task
    expect(mockOpenEditor).toHaveBeenCalled();
    expect(capturedTask).toBeDefined();
    expect(capturedTask?.id).toBe("task-001"); // Same ID as existing task
    expect(capturedTask?.name).toBe("Updated task"); // Updated name
  });
});
