type PluginEventMap = {
  'task:create': { 
    source: string;
    suggestedName?: string;
    linkedBlockId?: string;
    linkedBlockContent?: string;
    suggestedTime?: string | null;
  };
  'task:complete': { taskId: string };
  'task:snooze': { taskId: string; minutes: number };
  'task:settings': { action?: string };
  'task:refresh': void;
};

type EventHandler<T> = (data: T) => void;

export class PluginEventBus {
  private handlers: Map<string, Set<EventHandler<any>>> = new Map();

  on<K extends keyof PluginEventMap>(event: K, handler: EventHandler<PluginEventMap[K]>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    return () => this.handlers.get(event)?.delete(handler);
  }

  emit<K extends keyof PluginEventMap>(event: K, data: PluginEventMap[K]): void {
    this.handlers.get(event)?.forEach(handler => handler(data));
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const pluginEventBus = new PluginEventBus();
