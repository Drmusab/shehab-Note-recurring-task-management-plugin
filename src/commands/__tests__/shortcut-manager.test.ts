/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ShortcutManager } from "@/commands/ShortcutManager";
import type { ShortcutHandlers } from "@/commands/ShortcutManager";
import type { TaskRepositoryProvider } from "@/core/storage/TaskRepository";

function createPluginStub() {
  const store = new Map<string, any>();
  const addCommand = vi.fn();
  const plugin = {
    addCommand,
    loadData: vi.fn(async (key: string) => store.get(key)),
    saveData: vi.fn(async (key: string, value: any) => {
      store.set(key, value);
    }),
  };
  return { plugin, addCommand };
}

function createRepositoryStub(overrides: Partial<TaskRepositoryProvider> = {}): TaskRepositoryProvider {
  return {
    getAllTasks: vi.fn(),
    getTask: vi.fn(),
    getTaskByBlockId: vi.fn(),
    getEnabledTasks: vi.fn(),
    getTasksDueOnOrBefore: vi.fn(),
    getTodayAndOverdueTasks: vi.fn(),
    getTasksInRange: vi.fn(),
    saveTask: vi.fn(),
    deleteTask: vi.fn(),
    archiveTask: vi.fn(),
    loadArchive: vi.fn(),
    flush: vi.fn(),
    ...overrides,
  };
}

function getCommandCallback(addCommand: ReturnType<typeof vi.fn>, langKey: string) {
  const call = addCommand.mock.calls.find(([command]) => command.langKey === langKey);
  return call?.[0]?.callback as (() => void) | undefined;
}

describe("ShortcutManager", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("does not fire task completion while typing in an input", async () => {
    const { plugin, addCommand } = createPluginStub();
    const handlers: ShortcutHandlers = {
      createTask: vi.fn(),
      completeTask: vi.fn(),
      postponeTask: vi.fn(),
      openDock: vi.fn(),
      openTaskEditor: vi.fn(),
    };
    const repository = createRepositoryStub();
    const manager = new ShortcutManager(
      plugin as any,
      repository,
      undefined,
      undefined,
      handlers
    );
    await manager.initialize();
    manager.registerShortcuts();

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    const callback = getCommandCallback(addCommand, "markTaskDone");
    await callback?.();

    expect(handlers.completeTask).not.toHaveBeenCalled();
  });

  it("completes the focused task and triggers the completion handler", async () => {
    const { plugin, addCommand } = createPluginStub();
    const handlers: ShortcutHandlers = {
      createTask: vi.fn(),
      completeTask: vi.fn(),
      postponeTask: vi.fn(),
      openDock: vi.fn(),
      openTaskEditor: vi.fn(),
    };
    const repository = createRepositoryStub();
    const manager = new ShortcutManager(
      plugin as any,
      repository,
      undefined,
      undefined,
      handlers
    );
    await manager.initialize();
    manager.registerShortcuts();

    const task = document.createElement("div");
    task.dataset.taskId = "task-123";
    task.tabIndex = 0;
    document.body.appendChild(task);
    task.focus();

    const callback = getCommandCallback(addCommand, "markTaskDone");
    await callback?.();

    expect(handlers.completeTask).toHaveBeenCalledWith("task-123");
  });

  it("does nothing when no task is selected", async () => {
    const { plugin, addCommand } = createPluginStub();
    const handlers: ShortcutHandlers = {
      createTask: vi.fn(),
      completeTask: vi.fn(),
      postponeTask: vi.fn(),
      openDock: vi.fn(),
      openTaskEditor: vi.fn(),
    };
    const repository = createRepositoryStub({
      getTaskByBlockId: vi.fn().mockReturnValue(undefined),
    });
    const manager = new ShortcutManager(
      plugin as any,
      repository,
      undefined,
      undefined,
      handlers
    );
    await manager.initialize();
    manager.registerShortcuts();

    const callback = getCommandCallback(addCommand, "markTaskDone");
    await callback?.();

    expect(handlers.completeTask).not.toHaveBeenCalled();
  });

  it("opens the postpone selector for the focused task", async () => {
    const { plugin, addCommand } = createPluginStub();
    const handlers: ShortcutHandlers = {
      createTask: vi.fn(),
      completeTask: vi.fn(),
      postponeTask: vi.fn(),
      openDock: vi.fn(),
      openTaskEditor: vi.fn(),
    };
    const repository = createRepositoryStub();
    const manager = new ShortcutManager(
      plugin as any,
      repository,
      undefined,
      undefined,
      handlers
    );
    await manager.initialize();
    manager.registerShortcuts();

    const task = document.createElement("div");
    task.dataset.taskId = "task-456";
    task.tabIndex = 0;
    document.body.appendChild(task);
    task.focus();

    const callback = getCommandCallback(addCommand, "postponeTask");
    await callback?.();

    expect(handlers.postponeTask).toHaveBeenCalledWith("task-456");
  });

  it("prevents duplicate quick add triggers within the cooldown window", async () => {
    vi.useFakeTimers();
    const { plugin, addCommand } = createPluginStub();
    const handlers: ShortcutHandlers = {
      createTask: vi.fn(),
      completeTask: vi.fn(),
      postponeTask: vi.fn(),
      openDock: vi.fn(),
      openTaskEditor: vi.fn(),
    };
    const repository = createRepositoryStub();
    const manager = new ShortcutManager(
      plugin as any,
      repository,
      undefined,
      undefined,
      handlers
    );
    await manager.initialize();
    manager.registerShortcuts();

    const callback = getCommandCallback(addCommand, "quickAddTask");
    callback?.();
    callback?.();

    expect(handlers.createTask).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(500);
    callback?.();

    expect(handlers.createTask).toHaveBeenCalledTimes(2);
  });
});
