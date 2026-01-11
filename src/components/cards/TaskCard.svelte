<script lang="ts">
  import type { Task } from "@/core/models/Task";
  import { formatDateTime, isOverdue, isToday } from "@/utils/date";

  interface Props {
    task: Task;
    onDone: (task: Task) => void;
    onDelay: (task: Task) => void;
    onSkip: (task: Task) => void;
    onEdit?: (task: Task) => void;
  }

  let { task, onDone, onDelay, onSkip, onEdit }: Props = $props();

  const dueDate = $derived(new Date(task.dueAt));
  const overdue = $derived(isOverdue(dueDate));
  const today = $derived(isToday(dueDate));
  const statusClass = $derived(
    overdue ? "task-card--overdue" : today ? "task-card--today" : ""
  );

  function handleDone() {
    onDone(task);
  }

  function handleDelay() {
    onDelay(task);
  }

  function handleEdit() {
    if (onEdit) {
      onEdit(task);
    }
  }

  function handleSkip() {
    onSkip(task);
  }
</script>

<div class="task-card {statusClass}">
  <div class="task-card__header">
    <h3 class="task-card__name">{task.name}</h3>
    {#if onEdit}
      <button class="task-card__edit-btn" onclick={handleEdit} title="Edit">
        ✏️
      </button>
    {/if}
  </div>

  <div class="task-card__details">
    <div class="task-card__due">
      <span class="task-card__label">Due:</span>
      <span class="task-card__value">{formatDateTime(dueDate)}</span>
    </div>

    {#if task.lastCompletedAt}
      <div class="task-card__last-completed">
        <span class="task-card__label">Last completed:</span>
        <span class="task-card__value">
          {formatDateTime(new Date(task.lastCompletedAt))}
        </span>
      </div>
    {/if}
  </div>

  <div class="task-card__actions">
    <button class="task-card__action task-card__action--delay" onclick={handleDelay}>
      🕒 Delay to Tomorrow
    </button>
    <button class="task-card__action task-card__action--skip" onclick={handleSkip}>
      ⏭️ Skip
    </button>
    <button class="task-card__action task-card__action--done" onclick={handleDone}>
      ✅ Done
    </button>
  </div>
</div>

<style>
  .task-card {
    background: var(--b3-theme-surface);
    border: 1px solid var(--b3-border-color);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
    transition: all 0.2s ease;
  }

  .task-card:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .task-card--overdue {
    border-left: 4px solid var(--b3-theme-error);
  }

  .task-card--today {
    border-left: 4px solid var(--b3-theme-primary);
  }

  .task-card__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .task-card__name {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--b3-theme-on-surface);
  }

  .task-card__edit-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background 0.2s;
  }

  .task-card__edit-btn:hover {
    background: var(--b3-theme-surface-lighter);
  }

  .task-card__details {
    margin-bottom: 12px;
    font-size: 14px;
  }

  .task-card__due,
  .task-card__last-completed {
    margin-bottom: 6px;
  }

  .task-card__label {
    color: var(--b3-theme-on-surface-light);
    margin-right: 8px;
  }

  .task-card__value {
    color: var(--b3-theme-on-surface);
    font-weight: 500;
  }

  .task-card__actions {
    display: flex;
    gap: 8px;
  }

  .task-card__action {
    flex: 1;
    padding: 8px 12px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .task-card__action--delay {
    background: var(--b3-theme-surface-lighter);
    color: var(--b3-theme-on-surface);
  }

  .task-card__action--delay:hover {
    background: var(--b3-theme-surface-light);
  }

  .task-card__action--skip {
    background: var(--b3-theme-surface-lighter);
    color: var(--b3-theme-on-surface);
  }

  .task-card__action--skip:hover {
    background: var(--b3-theme-surface-light);
  }

  .task-card__action--done {
    background: var(--b3-theme-primary);
    color: white;
  }

  .task-card__action--done:hover {
    background: var(--b3-theme-primary-light);
  }
</style>
