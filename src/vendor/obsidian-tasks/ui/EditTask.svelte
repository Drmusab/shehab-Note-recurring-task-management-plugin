<script lang="ts">
    /**
     * EditTask.svelte - Thin wrapper around EditTaskCore
     * 
     * Maintains backward compatibility with existing code while delegating
     * to EditTaskCore for actual implementation. Defaults to 'modal' mode.
     */
    import type { Status } from '@/vendor/obsidian-tasks/types/Status';
    import type { Task } from '@/vendor/obsidian-tasks/types/Task';
    import EditTaskCore from '@/ui/EditTaskCore.svelte';

    // These exported variables are passed in as props for backward compatibility:
    export let task: Task;
    export let onSubmit: (updatedTasks: Task[]) => void | Promise<void>;
    export let statusOptions: Status[];
    export let allTasks: Task[];

    const handleSave = async (event: CustomEvent<Task[]>) => {
        await onSubmit(event.detail);
    };

    const handleCancel = () => {
        // Cancel means submit empty array (backward compatible behavior)
        onSubmit([]);
    };
</script>

<EditTaskCore
    {task}
    {allTasks}
    {statusOptions}
    mode="modal"
    on:save={handleSave}
    on:cancel={handleCancel}
/>
