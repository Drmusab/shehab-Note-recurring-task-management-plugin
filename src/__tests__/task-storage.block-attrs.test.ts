import { beforeEach, describe, expect, it, vi } from "vitest";
import { TaskStorage } from "@/core/storage/TaskStorage";
import { createTask } from "@/core/models/Task";
import type { Frequency } from "@/core/models/Frequency";
import { SiYuanApiAdapter } from "@/core/api/SiYuanApiAdapter";
import * as logger from "@/utils/logger";
import {
  BLOCK_ATTR_TASK_DUE,
  BLOCK_ATTR_TASK_ENABLED,
  BLOCK_ATTR_TASK_ID,
} from "@/utils/constants";

const mockPlugin = {
  loadData: vi.fn(),
  saveData: vi.fn(),
  data: {},
  name: "task-plugin",
} as any;

const frequency: Frequency = {
  type: "daily",
  interval: 1,
  time: "09:00",
};

describe("TaskStorage - Block Attribute Sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    logger.clearLogs();
    mockPlugin.data = {};
    mockPlugin.loadData.mockImplementation((key: string) => Promise.resolve(mockPlugin.data[key]));
    mockPlugin.saveData.mockImplementation((key: string, value: any) => {
      mockPlugin.data[key] = value;
      return Promise.resolve();
    });
  });

  it("syncs block attributes when API is available", async () => {
    const setBlockAttrs = vi.fn().mockResolvedValue(undefined);
    const adapter = new SiYuanApiAdapter({ setBlockAttrs } as any);
    const storage = new TaskStorage(mockPlugin, adapter);
    await storage.init();

    const task = createTask("Task with block", frequency);
    task.linkedBlockId = "block-123";

    await expect(storage.saveTask(task)).resolves.not.toThrow();
    expect(setBlockAttrs).toHaveBeenCalledTimes(1);
    expect(setBlockAttrs).toHaveBeenCalledWith("block-123", {
      [BLOCK_ATTR_TASK_ID]: task.id,
      [BLOCK_ATTR_TASK_DUE]: task.dueAt,
      [BLOCK_ATTR_TASK_ENABLED]: "true",
    });
  });

  it("falls back gracefully when API is missing", async () => {
    const adapter = new SiYuanApiAdapter({} as any);
    const storage = new TaskStorage(mockPlugin, adapter);
    await storage.init();

    const task = createTask("Task without API", frequency);
    task.linkedBlockId = "block-999";

    await expect(storage.saveTask(task)).resolves.not.toThrow();

    const logs = logger.getRecentLogs();
    const warnEntry = logs.find(
      (entry) => entry.level === "warn" && entry.message.includes("Block attribute sync unavailable"),
    );
    expect(warnEntry).toBeDefined();
  });

  it("disables block sync when API throws", async () => {
    const setBlockAttrs = vi.fn().mockRejectedValue(new Error("boom"));
    const adapter = new SiYuanApiAdapter({ setBlockAttrs } as any);
    const storage = new TaskStorage(mockPlugin, adapter);
    await storage.init();

    const task = createTask("Task with failure", frequency);
    task.linkedBlockId = "block-777";

    await expect(storage.saveTask(task)).resolves.not.toThrow();
    expect(setBlockAttrs).toHaveBeenCalledTimes(1);

    const secondTask = createTask("Task after failure", frequency);
    secondTask.linkedBlockId = "block-888";
    await expect(storage.saveTask(secondTask)).resolves.not.toThrow();
    expect(setBlockAttrs).toHaveBeenCalledTimes(1);

    const logs = logger.getRecentLogs();
    const warnEntry = logs.find(
      (entry) => entry.level === "warn" && entry.message.includes("Failed to sync block attributes"),
    );
    expect(warnEntry).toBeDefined();
  });
});
