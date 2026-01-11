# API Documentation

## Core Classes

### Task

Represents a recurring task with all its properties.

```typescript
interface Task {
  id: string;                      // Unique identifier
  name: string;                    // Task name/title
  status: boolean;                 // Completion state
  lastCompletedAt: string | null;  // Last completion timestamp (ISO)
  dueAt: string;                   // Current due date (ISO)
  frequency: Frequency;            // Recurrence rule
  alertPayload: AlertPayload;      // Notification data
  enabled: boolean;                // Active state
  createdAt: string;              // Creation timestamp (ISO)
  updatedAt: string;              // Last update timestamp (ISO)
}
```

#### Methods

**createTask(name, frequency, dueAt?): Task**

Creates a new task with default values.

```typescript
import { createTask } from "@/core/models/Task";
import { createDefaultFrequency } from "@/core/models/Frequency";

const task = createTask("My Task", createDefaultFrequency());
```

**isTask(obj): boolean**

Type guard to check if an object is a valid Task.

---

### Frequency

Defines how a task recurs.

```typescript
interface Frequency {
  type: "daily" | "weekly" | "monthly";  // Recurrence type
  interval: number;                       // Every N periods
  time?: string;                          // Fixed time (HH:mm)
  weekdays?: number[];                    // For weekly (0-6)
}
```

#### Methods

**createDefaultFrequency(): Frequency**

Creates a default daily frequency at 09:00.

**isValidFrequency(frequency): boolean**

Validates a frequency object.

---

### RecurrenceEngine

Calculates next occurrence dates based on frequency rules.

```typescript
class RecurrenceEngine {
  calculateNext(currentDue: Date, frequency: Frequency): Date;
  getOccurrencesInRange(
    startDate: Date,
    endDate: Date,
    frequency: Frequency,
    firstOccurrence: Date
  ): Date[];
}
```

#### Methods

**calculateNext(currentDue, frequency): Date**

Calculates the next occurrence after the current due date.

```typescript
const engine = new RecurrenceEngine();
const nextDue = engine.calculateNext(
  new Date("2024-01-15"),
  { type: "daily", interval: 1, time: "09:00" }
);
// Returns: 2024-01-16 09:00:00
```

**getOccurrencesInRange(startDate, endDate, frequency, firstOccurrence): Date[]**

Gets all occurrences within a date range.

```typescript
const occurrences = engine.getOccurrencesInRange(
  new Date("2024-01-01"),
  new Date("2024-01-31"),
  { type: "weekly", interval: 1, weekdays: [1, 3, 5] },
  new Date("2024-01-01")
);
// Returns array of dates on Mondays, Wednesdays, and Fridays
```

---

### TaskStorage

Manages task persistence using SiYuan storage API.

```typescript
class TaskStorage {
  async init(): Promise<void>;
  async save(): Promise<void>;
  getAllTasks(): Task[];
  getTask(id: string): Task | undefined;
  async saveTask(task: Task): Promise<void>;
  async deleteTask(id: string): Promise<void>;
  getEnabledTasks(): Task[];
  getTodayAndOverdueTasks(): Task[];
  getTasksInRange(startDate: Date, endDate: Date): Task[];
}
```

#### Methods

**init(): Promise<void>**

Loads tasks from disk. Must be called before other operations.

**saveTask(task): Promise<void>**

Saves or updates a task.

```typescript
await storage.saveTask(task);
```

**getAllTasks(): Task[]**

Returns all tasks.

**getTodayAndOverdueTasks(): Task[]**

Returns tasks due today or earlier.

**getTasksInRange(startDate, endDate): Task[]**

Returns tasks due within a date range.

---

### Scheduler

Manages task timing and triggers notifications.

```typescript
class Scheduler {
  start(onTaskDue: (task: Task) => void): void;
  stop(): void;
  async markTaskDone(taskId: string): Promise<void>;
  async delayTaskToTomorrow(taskId: string): Promise<void>;
  getRecurrenceEngine(): RecurrenceEngine;
}
```

#### Methods

**start(onTaskDue): void**

Starts the scheduler with a callback for due tasks.

```typescript
scheduler.start(async (task) => {
  await notificationService.notifyTask(task);
});
```

**stop(): void**

Stops the scheduler.

**markTaskDone(taskId): Promise<void>**

Marks a task as done and reschedules it.

```typescript
await scheduler.markTaskDone(task.id);
```

**delayTaskToTomorrow(taskId): Promise<void>**

Delays a task by one day without affecting recurrence.

---

### NotificationService

Orchestrates multi-channel notification delivery.

```typescript
class NotificationService {
  async init(): Promise<void>;
  async saveConfig(config: NotificationConfig): Promise<void>;
  async notifyTask(task: Task): Promise<void>;
  getConfig(): NotificationConfig;
  async testChannel(channel: "n8n" | "telegram" | "gmail"): Promise<boolean>;
}
```

#### Methods

**init(): Promise<void>**

Initializes the service and loads configuration.

**notifyTask(task): Promise<void>**

Sends notifications for a task through all configured channels.

```typescript
await notificationService.notifyTask(task);
```

**saveConfig(config): Promise<void>**

Saves notification configuration.

```typescript
await notificationService.saveConfig({
  n8n: { webhookUrl: "https://...", enabled: true },
  telegram: { botToken: "...", chatId: "...", enabled: true },
  gmail: { ... }
});
```

**testChannel(channel): Promise<boolean>**

Tests a specific notification channel.

---

## Notification Types

### NotificationMessage

Message sent to notification channels.

```typescript
interface NotificationMessage {
  taskName: string;
  dueAt: string;
  payload: {
    note?: string;
    media?: string;
    link?: string;
  };
}
```

### NotificationSender

Interface for notification channel implementations.

```typescript
interface NotificationSender {
  send(message: NotificationMessage): Promise<boolean>;
  isConfigured(): boolean;
}
```

### Channel Configurations

**N8nConfig**
```typescript
interface N8nConfig {
  webhookUrl: string;
  enabled: boolean;
}
```

**TelegramConfig**
```typescript
interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
}
```

**GmailConfig**
```typescript
interface GmailConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  recipientEmail: string;
  enabled: boolean;
}
```

---

## Utility Functions

### Date Utilities

Located in `src/utils/date.ts`:

- `parseTime(timeStr: string): { hours: number; minutes: number }`
- `formatTime(date: Date): string`
- `formatDate(date: Date): string`
- `formatDateTime(date: Date): string`
- `isToday(date: Date): boolean`
- `isPast(date: Date): boolean`
- `isOverdue(date: Date): boolean`
- `addDays(date: Date, days: number): Date`
- `addWeeks(date: Date, weeks: number): Date`
- `addMonths(date: Date, months: number): Date`
- `setTime(date: Date, hours: number, minutes: number): Date`
- `startOfDay(date: Date): Date`
- `endOfDay(date: Date): Date`
- `daysBetween(date1: Date, date2: Date): number`
- `getDateRange(startDate: Date, days: number): Date[]`

### Constants

Located in `src/utils/constants.ts`:

- `PLUGIN_NAME` - Plugin identifier
- `STORAGE_KEY` - Storage key for tasks
- `SETTINGS_KEY` - Storage key for settings
- `DOCK_TYPE` - Dock panel type identifier
- `DEFAULT_NOTIFICATION_CONFIG` - Default notification configuration
- `SCHEDULER_INTERVAL_MS` - Scheduler check interval (60000ms)
- `TIMELINE_DAYS` - Default timeline range (30 days)

---

## Plugin Lifecycle

### Initialization

```typescript
class RecurringTasksPlugin extends Plugin {
  async onload() {
    // 1. Initialize storage
    this.storage = new TaskStorage(this);
    await this.storage.init();
    
    // 2. Initialize notification service
    this.notificationService = new NotificationService(this);
    await this.notificationService.init();
    
    // 3. Start scheduler
    this.scheduler = new Scheduler(this.storage);
    this.scheduler.start(async (task) => {
      await this.notificationService.notifyTask(task);
    });
    
    // 4. Add dock panel
    this.addDock({ ... });
  }
  
  async onunload() {
    // 1. Stop scheduler
    this.scheduler.stop();
    
    // 2. Destroy UI
    this.destroyDashboard();
  }
}
```

---

## Examples

### Creating a Daily Task

```typescript
import { createTask } from "@/core/models/Task";

const task = createTask("Daily Review", {
  type: "daily",
  interval: 1,
  time: "09:00"
}, new Date());

task.alertPayload = {
  note: "Review your tasks for today"
};

await storage.saveTask(task);
```

### Creating a Weekly Task

```typescript
const weeklyTask = createTask("Weekly Planning", {
  type: "weekly",
  interval: 1,
  weekdays: [1], // Monday
  time: "10:00"
});

await storage.saveTask(weeklyTask);
```

### Getting Upcoming Tasks

```typescript
const today = new Date();
const nextWeek = new Date(today);
nextWeek.setDate(nextWeek.getDate() + 7);

const upcomingTasks = storage.getTasksInRange(today, nextWeek);
```

### Sending a Test Notification

```typescript
const success = await notificationService.testChannel("telegram");
if (success) {
  console.log("Test notification sent!");
}
```
