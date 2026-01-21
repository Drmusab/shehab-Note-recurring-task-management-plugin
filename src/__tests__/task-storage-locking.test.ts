import { describe, it, expect, beforeEach } from "vitest";
import { TaskStorage } from "@/core/storage/TaskStorage";
import { createTask } from "@/core/models/Task";
import type { Plugin } from "siyuan";
import { SiYuanApiAdapter } from "@/core/api/SiYuanApiAdapter";
import { CURRENT_SCHEMA_VERSION } from "@/utils/constants";

// Mock Plugin
const createMockPlugin = (): Plugin => {
  const storage = new Map<string, any>();
  
  return {
    loadData: async (key: string) => storage.get(key),
    saveData: async (key: string, data: any) => {
      storage.set(key, data);
    },
  } as any;
};

// Mock SiYuanApiAdapter
class MockApiAdapter extends SiYuanApiAdapter {
  constructor() {
    super();
    this.supportedCapabilities.setBlockAttrs = false; // Disable for tests
  }
  
  async setBlockAttrs() {
    // No-op for tests
  }
}

describe("TaskStorage - Optimistic Locking", () => {
  let storage: TaskStorage;
  let plugin: Plugin;
  let apiAdapter: MockApiAdapter;

  beforeEach(async () => {
    plugin = createMockPlugin();
    apiAdapter = new MockApiAdapter();
    storage = new TaskStorage(plugin, apiAdapter);
    await storage.init();
  });

  it("should allow saving a task with no previous version", async () => {
    const task = createTask("Test Task", { type: "daily", interval: 1 });
    const initialVersion = task.version;
    
    await expect(storage.saveTask(task)).resolves.not.toThrow();
    
    const savedTask = storage.getTask(task.id);
    expect(savedTask).toBeDefined();
    expect(savedTask?.version).toBe((initialVersion ?? 0) + 1);
  });

  it("should allow saving a task with matching version", async () => {
    const task = createTask("Test Task", { type: "daily", interval: 1 });
    
    await storage.saveTask(task);
    const savedTask = storage.getTask(task.id);
    const expectedVersion = savedTask?.version;
    
    // Modify the task with the current version
    if (savedTask) {
      savedTask.name = "Updated Task";
      await expect(storage.saveTask(savedTask)).resolves.not.toThrow();
      
      const updatedTask = storage.getTask(task.id);
      expect(updatedTask?.name).toBe("Updated Task");
      expect(updatedTask?.version).toBe((expectedVersion ?? 0) + 1);
    }
  });

  it("should reject concurrent modification (stale version)", async () => {
    const task = createTask("Test Task", { type: "daily", interval: 1 });
    
    await storage.saveTask(task);
    const savedTask1 = storage.getTask(task.id);
    const savedTask2 = { ...storage.getTask(task.id)! }; // Clone
    
    // First update succeeds
    if (savedTask1) {
      savedTask1.name = "Update 1";
      await storage.saveTask(savedTask1);
    }
    
    // Second update with stale version should fail
    savedTask2.name = "Update 2";
    await expect(storage.saveTask(savedTask2)).rejects.toThrow(
      /Concurrent modification detected/
    );
  });

  it("should increment version on each save", async () => {
    const task = createTask("Test Task", { type: "daily", interval: 1 });
    
    await storage.saveTask(task);
    let savedTask = storage.getTask(task.id);
    const firstVersion = savedTask?.version;
    expect(firstVersion).toBeGreaterThan(0);
    
    // Second save
    if (savedTask) {
      savedTask.name = "Update 1";
      await storage.saveTask(savedTask);
      savedTask = storage.getTask(task.id);
      expect(savedTask?.version).toBe((firstVersion ?? 0) + 1);
    }
    
    // Third save
    if (savedTask) {
      savedTask.name = "Update 2";
      const secondVersion = savedTask.version;
      await storage.saveTask(savedTask);
      savedTask = storage.getTask(task.id);
      expect(savedTask?.version).toBe((secondVersion ?? 0) + 1);
    }
  });

  it("should handle undefined version as 0", async () => {
    const task = createTask("Test Task", { type: "daily", interval: 1 });
    task.version = undefined;
    
    await storage.saveTask(task);
    const savedTask = storage.getTask(task.id);
    expect(savedTask?.version).toBe(1);
  });

  it("should allow new task with undefined version when existing task exists", async () => {
    const task1 = createTask("Task 1", { type: "daily", interval: 1 });
    await storage.saveTask(task1);
    
    const task2 = createTask("Task 2", { type: "daily", interval: 1 });
    task2.version = undefined;
    
    await expect(storage.saveTask(task2)).resolves.not.toThrow();
    expect(storage.getTask(task2.id)?.version).toBe(1);
  });
});
