import { GlobalFilter, parseTypedDateForSaving, PriorityTools, replaceTaskWithTasks } from '../types/Stubs';
import type { Status } from '../types/Status';
import { StatusType } from '../types/Status';
import { Occurrence, Priority, Recurrence, Task, addDependencyToParent, ensureTaskHasId, generateUniqueId, removeDependency } from '../types/Task';

type OnCompletion = any; // Stub type

/**
 * {@link Task} objects are immutable. This class allows to create a mutable object from a {@link Task}, apply the edits,
 * and get the resulting task(s).
 *
 */
export class EditableTask {
    private readonly addGlobalFilterOnSave: boolean;
    private readonly originalBlocking: Task[];

    // NEW_TASK_FIELD_EDIT_REQUIRED
    description: string;
    status: Status;
    priority: string;
    recurrenceRule: string;
    onCompletion: OnCompletion;
    createdDate: string;
    startDate: string;
    scheduledDate: string;
    dueDate: string;
    doneDate: string;
    cancelledDate: string;
    forwardOnly: boolean;
    blockedBy: Task[];
    blocking: Task[];

    private constructor(editableTask: {
        addGlobalFilterOnSave: boolean;
        originalBlocking: Task[];

        // NEW_TASK_FIELD_EDIT_REQUIRED
        description: string;
        status: Status;
        priority: string;
        onCompletion: OnCompletion;
        recurrenceRule: string;
        createdDate: string;
        startDate: string;
        scheduledDate: string;
        dueDate: string;
        doneDate: string;
        cancelledDate: string;
        forwardOnly: boolean;
        blockedBy: Task[];
        blocking: Task[];
    }) {
        this.addGlobalFilterOnSave = editableTask.addGlobalFilterOnSave;
        this.originalBlocking = editableTask.originalBlocking;

        this.description = editableTask.description;
        this.status = editableTask.status;
        this.priority = editableTask.priority;
        this.onCompletion = editableTask.onCompletion;
        this.recurrenceRule = editableTask.recurrenceRule;
        this.createdDate = editableTask.createdDate;
        this.startDate = editableTask.startDate;
        this.scheduledDate = editableTask.scheduledDate;
        this.dueDate = editableTask.dueDate;
        this.doneDate = editableTask.doneDate;
        this.cancelledDate = editableTask.cancelledDate;
        this.forwardOnly = editableTask.forwardOnly;
        this.blockedBy = editableTask.blockedBy;
        this.blocking = editableTask.blocking;
    }

    /**
     * Use this factory to create an editable task from a {@link Task} object.
     *
     * @param task
     * @param allTasks
     */
    public static fromTask(task: Task, allTasks: Task[]): EditableTask {
        const description = GlobalFilter.getInstance().removeAsWordFrom(task.description);
        const addGlobalFilterOnSave = false;

        let priority = 'none';
        if (task.priority === Priority.Lowest) {
            priority = 'lowest';
        } else if (task.priority === Priority.Low) {
            priority = 'low';
        } else if (task.priority === Priority.Medium) {
            priority = 'medium';
        } else if (task.priority === Priority.High) {
            priority = 'high';
        } else if (task.priority === Priority.Highest) {
            priority = 'highest';
        }

        const blockedBy: Task[] = [];

        for (const taskId of (task.dependsOn || [])) {
            const depTask = allTasks.find((cacheTask) => cacheTask.id === taskId);

            if (!depTask) continue;

            blockedBy.push(depTask);
        }

        const originalBlocking = allTasks.filter((cacheTask) => 
            (cacheTask.dependsOn || []).includes(task.id)
        );

        return new EditableTask({
            addGlobalFilterOnSave,
            originalBlocking,

            // NEW_TASK_FIELD_EDIT_REQUIRED
            description,
            status: task.status,
            priority,
            recurrenceRule: task.recurrence || task.recurrenceRule || '',
            onCompletion: task.onCompletion || null,
            createdDate: task.createdDate || task.created?.formatAsDate() || '',
            startDate: task.startDate || task.start?.formatAsDate() || '',
            scheduledDate: task.scheduledDate || task.scheduled?.formatAsDate() || '',
            dueDate: task.dueDate || task.due?.formatAsDate() || '',
            doneDate: task.doneDate || task.done?.formatAsDate() || '',
            cancelledDate: task.cancelledDate || task.cancelled?.formatAsDate() || '',
            forwardOnly: true,
            blockedBy: blockedBy,
            blocking: originalBlocking,
        });
    }

    /**
     * Generates a {@link Task} object from the current {@link EditableTask}. Use this to output the new tasks after the edits.
     *
     * There are cases where the output of the edits is more than one task, for example, completing a {@link Task} with {@link Recurrence}.
     *
     * @param task
     * @param allTasks
     */
    public async applyEdits(task: Task, allTasks: Task[]): Promise<Task[]> {
        // Simplified version - just return the updated task
        const updatedTask: Task = {
            ...task,
            description: this.description.trim(),
            status: this.status,
            priority: PriorityTools.priorityValue(this.priority),
            recurrence: this.recurrenceRule || null,
            startDate: this.startDate || null,
            scheduledDate: this.scheduledDate || null,
            dueDate: this.dueDate || null,
            doneDate: this.doneDate || null,
            createdDate: this.createdDate || null,
            cancelledDate: this.cancelledDate || null,
            dependsOn: this.blockedBy.map(t => t.id),
        };
        
        return [updatedTask];
    }

    public parseAndValidateRecurrence() {
        // NEW_TASK_FIELD_EDIT_REQUIRED
        if (!this.recurrenceRule) {
            return { parsedRecurrence: '<i>not recurring</>', isRecurrenceValid: true };
        }

        const recurrenceFromText = Recurrence.fromText({
            recurrenceRuleText: this.recurrenceRule,
            // Only for representation in the modal, no dates required.
            occurrence: new Occurrence({ startDate: null, scheduledDate: null, dueDate: null }),
        })?.toText();

        if (!recurrenceFromText) {
            return { parsedRecurrence: '<i>invalid recurrence rule</i>', isRecurrenceValid: false };
        }

        if (this.startDate || this.scheduledDate || this.dueDate) {
            return { parsedRecurrence: recurrenceFromText, isRecurrenceValid: true };
        }

        return { parsedRecurrence: '<i>due, scheduled or start date required</i>', isRecurrenceValid: false };
    }
}

async function serialiseTaskId(task: Task, allTasks: Task[]) {
    if (task.id !== '') return task;

    const tasksWithId = allTasks.filter((task) => task.id !== '');

    const updatedTask = ensureTaskHasId(
        task,
        tasksWithId.map((task) => task.id),
    );

    await replaceTaskWithTasks({ originalTask: task, newTasks: updatedTask });

    return updatedTask;
}
