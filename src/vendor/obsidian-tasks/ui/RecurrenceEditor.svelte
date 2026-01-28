<script lang="ts">
    import { TASK_FORMATS } from '@/vendor/obsidian-tasks/types/Settings';
    import type { EditableTask } from '@/vendor/obsidian-tasks/ui/EditableTask';
    import { labelContentWithAccessKey } from '@/vendor/obsidian-tasks/ui/EditTaskHelpers';

    export let editableTask: EditableTask;
    export let isRecurrenceValid: boolean;
    export let accesskey: string | null;

    let parsedRecurrence: string;

    $: ({ parsedRecurrence, isRecurrenceValid } = editableTask.parseAndValidateRecurrence());

    const { recurrenceSymbol } = TASK_FORMATS.tasksPluginEmoji.taskSerializer.symbols;
</script>

<label for="recurrence">{@html labelContentWithAccessKey('Recurs', accesskey)}</label>
<!-- svelte-ignore a11y-accesskey -->
<input
    bind:value={editableTask.recurrenceRule}
    id="recurrence"
    type="text"
    class:tasks-modal-error={!isRecurrenceValid}
    class="tasks-modal-date-input"
    placeholder="Try 'every day when done'"
    {accesskey}
/>
<code class="tasks-modal-parsed-date">{recurrenceSymbol} {@html parsedRecurrence}</code>
