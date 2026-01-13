import { beforeEach, describe, expect, it, vi } from "vitest";
import { EventService } from "@/services/EventService";
import { Scheduler } from "@/core/engine/Scheduler";
import { NotificationState } from "@/core/engine/NotificationState";
import { createTask } from "@/core/models/Task";

const createMockPlugin = () => {
  const data: Record<string, any> = {};
  return {
    data,
    loadData: vi.fn((key: string) => Promise.resolve(data[key])),
    saveData: vi.fn((key: string, value: any) => {
      data[key] = value;
      return Promise.resolve();
    }),
  } as any;
};

describe("EventService scheduler integration", () => {
  let plugin: any;
  let fetcher: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    plugin = createMockPlugin();
    fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ ok: true }),
    });
  });

  it("emits task.due when scheduler reports due tasks", async () => {
    const notificationState = new NotificationState(plugin, "test-notification-state");
    const eventService = new EventService(plugin, { fetcher, notificationState });
    await eventService.init();
    await eventService.saveConfig({
      n8n: { enabled: true, webhookUrl: "https://example.com", sharedSecret: "" },
    });

    const task = createTask(
      "Due Task",
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
    eventService.bindScheduler(scheduler);

    scheduler.runOnce();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(fetcher).toHaveBeenCalledTimes(1);
    const [, options] = fetcher.mock.calls[0];
    const payload = JSON.parse(options.body);
    expect(payload.event).toBe("task.due");
    expect(payload.routing.escalationLevel).toBe(0);
  });

  it("emits task.missed when scheduler reports overdue tasks", async () => {
    const notificationState = new NotificationState(plugin, "test-notification-state");
    const eventService = new EventService(plugin, { fetcher, notificationState });
    await eventService.init();
    await eventService.saveConfig({
      n8n: { enabled: true, webhookUrl: "https://example.com", sharedSecret: "" },
    });

    const overdueAt = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const task = createTask(
      "Overdue Task",
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
    eventService.bindScheduler(scheduler);

    scheduler.runOnce();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(fetcher).toHaveBeenCalledTimes(2);
    const payloads = fetcher.mock.calls.map(([, options]) =>
      JSON.parse(options.body)
    );
    const events = payloads.map((payload) => payload.event);
    expect(events).toContain("task.due");
    expect(events).toContain("task.missed");
  });
});
