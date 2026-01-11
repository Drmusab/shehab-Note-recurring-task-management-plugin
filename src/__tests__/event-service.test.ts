import { beforeEach, describe, expect, it, vi } from "vitest";
import { EventService } from "../services/EventService";
import { createTask } from "../core/models/Task";
import { EVENT_QUEUE_KEY, SETTINGS_KEY } from "../utils/constants";

const createPluginStub = () => {
  const store = new Map<string, any>();
  return {
    store,
    plugin: {
      loadData: vi.fn((key: string) => store.get(key) ?? null),
      saveData: vi.fn((key: string, value: any) => {
        store.set(key, value);
      }),
    },
  };
};

const okResponse = {
  ok: true,
  statusText: "OK",
  json: vi.fn().mockResolvedValue({ ok: true }),
};

const failResponse = {
  ok: false,
  statusText: "Failed",
  json: vi.fn().mockResolvedValue({ ok: false }),
};

describe("EventService", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("prevents duplicate task events", async () => {
    const { store, plugin } = createPluginStub();
    store.set(SETTINGS_KEY, {
      n8n: { webhookUrl: "https://example.com", sharedSecret: "secret", enabled: true },
    });
    store.set(EVENT_QUEUE_KEY, null);

    const fetcher = vi.fn().mockResolvedValue(okResponse);
    const service = new EventService(plugin as any, fetcher);
    await service.init();

    const task = createTask("Drink Water", { type: "daily", interval: 1, time: "10:15" });
    await service.emitTaskEvent("task.due", task);
    await service.emitTaskEvent("task.due", task);

    expect(fetcher).toHaveBeenCalledTimes(1);
    service.stopQueueWorker();
  });

  it("queues failed events and retries later", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));

    const { store, plugin } = createPluginStub();
    store.set(SETTINGS_KEY, {
      n8n: { webhookUrl: "https://example.com", sharedSecret: "", enabled: true },
    });
    store.set(EVENT_QUEUE_KEY, null);

    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(failResponse)
      .mockResolvedValueOnce(okResponse);
    const service = new EventService(plugin as any, fetcher);
    await service.init();

    const task = createTask("Stretch", { type: "daily", interval: 1, time: "08:00" });
    await service.emitTaskEvent("task.due", task);
    expect(fetcher).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date("2025-01-01T00:00:31Z"));
    await service.flushQueue();

    expect(fetcher).toHaveBeenCalledTimes(2);
    service.stopQueueWorker();
    vi.useRealTimers();
  });
});
