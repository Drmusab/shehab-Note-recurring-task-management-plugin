import { describe, expect, it, vi } from "vitest";
import { Scheduler } from "../core/engine/Scheduler";
import { createTask } from "../core/models/Task";
import { MISSED_GRACE_PERIOD_MS } from "../utils/constants";

describe("Scheduler", () => {
  it("fires due task once per occurrence", async () => {
    // Create a task that's due now (in the past by 1 second to ensure it's detected as due)
    const dueAt = new Date(Date.now() - 1000);
    const task = createTask(
      "Test task",
      { type: "daily", interval: 1, time: "09:00" },
      dueAt
    );
    task.enabled = true;

    const storage = {
      getEnabledTasks: () => [task],
      getTask: () => task,
      getTasksDueOnOrBefore: () => [task],
      saveTask: vi.fn(),
    };

    // No notification state provided, so it uses fallback logic
    const scheduler = new Scheduler(storage as any, 1000);
    let dueCount = 0;

    scheduler.on("task:due", () => {
      dueCount += 1;
    });
    
    scheduler.start();
    
    // Wait for start() to complete (it's async due to ensureEmittedStateLoaded)
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(dueCount).toBe(1);

    scheduler.runOnce();
    expect(dueCount).toBe(1);

    scheduler.stop();
  });

  it("runs without listeners", () => {
    const task = createTask(
      "No listeners task",
      { type: "daily", interval: 1, time: "09:00" },
      new Date()
    );
    task.enabled = true;

    const storage = {
      getEnabledTasks: () => [task],
      getTask: () => task,
      getTasksDueOnOrBefore: () => [task],
      saveTask: vi.fn(),
    };

    const scheduler = new Scheduler(storage as any, 1000);
    expect(() => {
      scheduler.start();
      scheduler.runOnce();
      scheduler.stop();
    }).not.toThrow();
  });

  it("emits semantic due/overdue events", () => {
    const overdueAt = new Date(Date.now() - MISSED_GRACE_PERIOD_MS - 1000);
    const task = createTask(
      "Overdue task",
      { type: "daily", interval: 1, time: "09:00" },
      overdueAt
    );
    task.enabled = true;

    const storage = {
      getEnabledTasks: () => [task],
      getTask: () => task,
      getTasksDueOnOrBefore: () => [task],
      saveTask: vi.fn(),
    };

    const scheduler = new Scheduler(storage as any, 1000);
    const dueEvents: any[] = [];
    const overdueEvents: any[] = [];

    scheduler.on("task:due", (event) => {
      dueEvents.push(event);
    });
    scheduler.on("task:overdue", (event) => {
      overdueEvents.push(event);
    });

    scheduler.runOnce();

    expect(dueEvents).toHaveLength(1);
    expect(overdueEvents).toHaveLength(1);
    expect(dueEvents[0].context).toBe("today");
    expect(overdueEvents[0].context).toBe("overdue");
    expect(dueEvents[0].taskId).toBe(task.id);
    expect(overdueEvents[0].dueAt.toISOString()).toBe(overdueAt.toISOString());
  });
});
