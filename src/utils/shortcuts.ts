export interface ShortcutInfo {
  label: string;
  description: string;
  keys: string;
  context?: string;
}

export const SHORTCUTS: ShortcutInfo[] = [
  {
    label: "Create recurring task",
    description: "Open the task creation flow from the editor selection.",
    keys: "⌘⇧R",
    context: "Editor",
  },
  {
    label: "Open recurring tasks dock",
    description: "Focus the recurring tasks dashboard.",
    keys: "⌘⇧T",
    context: "Global",
  },
  {
    label: "Quick complete next task",
    description: "Marks the most overdue task as complete.",
    keys: "⌘⇧D",
    context: "Global",
  },
];
