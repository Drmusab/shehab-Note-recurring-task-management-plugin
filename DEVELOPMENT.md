# Development Guide

## Getting Started

### Prerequisites
- Node.js 16 or higher
- npm or yarn
- Shehab-Note or SiYuan installation (optional, for testing)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Drmusab/plugin-sample-shehab-note.git
cd plugin-sample-shehab-note
```

2. Install dependencies:
```bash
npm install
```

3. Build the plugin:
```bash
npm run build
```

## Development Workflow

### Build Commands

- `npm run build` - Build the plugin for production
- `npm run dev` - Build in watch mode for development
- `npm run make-link` - Create a symbolic link to your Shehab-Note workspace

### Project Structure

```
src/
├── index.ts                      # Plugin entry point
├── index.scss                    # Global styles
├── core/                         # Business logic
│   ├── models/                   # Data models
│   │   ├── Task.ts              # Task entity
│   │   └── Frequency.ts         # Recurrence types
│   ├── engine/                   # Core algorithms
│   │   ├── RecurrenceEngine.ts  # Date calculation
│   │   └── Scheduler.ts         # Task scheduling
│   └── storage/                  # Data persistence
│       └── TaskStorage.ts       # Storage wrapper
├── services/                     # External integrations
│   ├── NotificationService.ts   # Notification orchestrator
│   └── senders/                 # Channel implementations
├── components/                   # Svelte UI
│   ├── Dashboard.svelte         # Main dashboard
│   ├── tabs/                    # Tab views
│   ├── cards/                   # Reusable components
│   └── settings/                # Settings UI
└── utils/                        # Utilities
```

## Key Concepts

### Task Entity

Tasks are the core data structure:

```typescript
interface Task {
  id: string;
  name: string;
  status: boolean;
  lastCompletedAt: string | null;
  dueAt: string;
  frequency: Frequency;
  alertPayload: AlertPayload;
  enabled: boolean;
}
```

### Recurrence Engine

The `RecurrenceEngine` calculates next occurrence dates:

```typescript
const engine = new RecurrenceEngine();
const nextDue = engine.calculateNext(currentDue, frequency);
```

### Scheduler

The `Scheduler` monitors tasks and triggers notifications:

```typescript
scheduler.start((task) => {
  // Task is due - send notification
  notificationService.notifyTask(task);
});
```

### Storage

Tasks are persisted using SiYuan's storage API:

```typescript
await storage.saveTask(task);
const tasks = storage.getAllTasks();
```

## Adding New Features

### Adding a New Notification Channel

1. Create a new sender in `src/services/senders/`:

```typescript
export class NewSender implements NotificationSender {
  async send(message: NotificationMessage): Promise<boolean> {
    // Implement sending logic
  }
  
  isConfigured(): boolean {
    // Check if properly configured
  }
}
```

2. Add configuration to `src/services/types.ts`
3. Register in `NotificationService`
4. Add UI in `Settings.svelte`

### Adding a New Tab

1. Create component in `src/components/tabs/`:

```svelte
<script lang="ts">
  // Your tab logic
</script>

<div class="my-tab">
  <!-- Your tab UI -->
</div>
```

2. Import and add to `Dashboard.svelte`

## Testing

### Manual Testing

1. Build the plugin: `npm run build`
2. Copy `dist/` to your Shehab-Note plugins directory
3. Restart Shehab-Note
4. Test functionality

### Using Symbolic Link

```bash
npm run make-link -- --workspace=/path/to/shehab-note/workspace
npm run dev
```

This creates a symbolic link so changes are reflected immediately.

## Debugging

### Console Logging

The plugin uses `console.log` for debugging:

```typescript
console.log("Task created:", task.name);
```

View logs in the browser console or SiYuan developer tools.

### Common Issues

**Plugin not loading:**
- Check `plugin.json` is valid
- Verify build output in `dist/`
- Check browser console for errors

**Notifications not sending:**
- Verify channel configuration in settings
- Check network tab for API calls
- Test individual channels using test buttons

**Tasks not rescheduling:**
- Check `RecurrenceEngine` logic
- Verify `Scheduler` is running
- Check task frequency configuration

## Code Style

- Use TypeScript for type safety
- Follow existing code patterns
- Use Svelte 5 runes syntax ($state, $derived, $effect)
- Add JSDoc comments for public APIs
- Use meaningful variable names

## Performance Considerations

- Scheduler runs every 60 seconds by default
- Limit timeline view to reasonable date ranges
- Use pagination for large task lists
- Debounce expensive operations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Resources

- [SiYuan Plugin API Documentation](https://docs.siyuan-note.com/en/plugin/)
- [Svelte 5 Documentation](https://svelte.dev/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
