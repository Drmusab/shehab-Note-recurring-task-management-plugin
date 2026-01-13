/** @vitest-environment jsdom */
import { render, fireEvent } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import AllTasksTab from "@/components/tabs/AllTasksTab.svelte";
import type { Task } from "@/core/models/Task";
import type { Frequency } from "@/core/models/Frequency";

const frequency: Frequency = {
  type: "daily",
  interval: 1,
  time: "09:00",
};

function createTask(id: string, name: string): Task {
  const now = new Date().toISOString();
  return {
    id,
    name,
    dueAt: now,
    frequency,
    enabled: true,
    createdAt: now,
    updatedAt: now,
  };
}

describe("AllTasksTab", () => {
  it("triggers bulk enable for selected tasks", async () => {
    const onBulkEnable = vi.fn();
    const onBulkDisable = vi.fn();
    const onBulkDelete = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onToggleEnabled = vi.fn();
    const onCreate = vi.fn();
    const tasks = [createTask("task-1", "Alpha"), createTask("task-2", "Beta")];

    const { getByLabelText, getByRole } = render(AllTasksTab, {
      props: {
        tasks,
        onEdit,
        onDelete,
        onToggleEnabled,
        onBulkEnable,
        onBulkDisable,
        onBulkDelete,
        onCreate,
      },
    });

    const checkbox = getByLabelText("Select Alpha");
    await fireEvent.click(checkbox);

    const enableButton = getByRole("button", { name: "Enable" });
    await fireEvent.click(enableButton);

    expect(onBulkEnable).toHaveBeenCalledTimes(1);
    expect(onBulkEnable.mock.calls[0][0]).toEqual(["task-1"]);
  });

  it("supports keyboard navigation between rows", async () => {
    const tasks = [createTask("task-1", "Alpha"), createTask("task-2", "Beta")];

    const { container } = render(AllTasksTab, {
      props: {
        tasks,
        onEdit: vi.fn(),
        onDelete: vi.fn(),
        onToggleEnabled: vi.fn(),
        onBulkEnable: vi.fn(),
        onBulkDisable: vi.fn(),
        onBulkDelete: vi.fn(),
        onCreate: vi.fn(),
      },
    });

    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBe(2);

    const firstRow = rows[0] as HTMLTableRowElement;
    const secondRow = rows[1] as HTMLTableRowElement;

    firstRow.focus();
    await fireEvent.keyDown(firstRow, { key: "ArrowDown" });

    expect(document.activeElement).toBe(secondRow);
  });
});
