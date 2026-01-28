/**
 * Modal wrapper for EditTaskCore component
 * 
 * Provides backward compatibility for existing modal workflows.
 * Uses Svelte mount/unmount pattern for rendering EditTaskCore in a modal context.
 */

import { mount, unmount } from 'svelte';
import type { Task } from '@/vendor/obsidian-tasks/types/Task';
import type { Status } from '@/vendor/obsidian-tasks/types/Status';
import EditTaskCore from '@/ui/EditTaskCore.svelte';

export interface EditTaskModalOptions {
    /** Task to edit */
    task: Task;
    /** All tasks for dependency management */
    allTasks: Task[];
    /** Available status options */
    statusOptions: Status[];
    /** Callback when save is triggered */
    onSave: (updatedTasks: Task[]) => void | Promise<void>;
    /** Optional callback when modal is closed */
    onClose?: () => void;
}

/**
 * EditTaskModal wrapper for backward compatibility
 * 
 * Wraps EditTaskCore in a modal overlay using the mount/unmount pattern
 * consistent with this codebase's approach (QuickAddOverlay, PostponeOverlay, etc.)
 */
export class EditTaskModal {
    private container: HTMLElement | null = null;
    private component: any = null;
    private options: EditTaskModalOptions;

    constructor(options: EditTaskModalOptions) {
        this.options = options;
    }

    /**
     * Open the modal and mount the EditTaskCore component
     */
    open(): void {
        // Create container
        this.container = document.createElement('div');
        this.container.classList.add('edit-task-modal-overlay');
        document.body.appendChild(this.container);

        // Create modal content wrapper
        const modalContent = document.createElement('div');
        modalContent.classList.add('edit-task-modal-content');
        this.container.appendChild(modalContent);

        // Mount EditTaskCore in modal mode with callback props
        this.component = mount(EditTaskCore, {
            target: modalContent,
            props: {
                task: this.options.task,
                allTasks: this.options.allTasks,
                statusOptions: this.options.statusOptions,
                mode: 'modal',
                // Pass callbacks as props that will handle component events
                onSave: (updatedTasks: Task[]) => this.handleSave(updatedTasks),
                onCancel: () => this.close(),
            },
        });

        // Handle click outside to close
        this.container.addEventListener('click', this.handleOverlayClick);
        
        // Handle escape key
        document.addEventListener('keydown', this.handleEscapeKey);
    }

    /**
     * Close the modal and cleanup
     */
    close(): void {
        // Remove event listeners
        if (this.container) {
            this.container.removeEventListener('click', this.handleOverlayClick);
        }
        document.removeEventListener('keydown', this.handleEscapeKey);

        // Unmount component
        if (this.component) {
            unmount(this.component);
            this.component = null;
        }

        // Remove container
        if (this.container) {
            this.container.remove();
            this.container = null;
        }

        // Call onClose callback if provided
        if (this.options.onClose) {
            this.options.onClose();
        }
    }

    private handleSave = async (updatedTasks: Task[]): Promise<void> => {
        await this.options.onSave(updatedTasks);
        this.close();
    };

    private handleOverlayClick = (event: MouseEvent): void => {
        // Close if clicking the overlay itself (not the content)
        if (event.target === this.container) {
            this.close();
        }
    };

    private handleEscapeKey = (event: KeyboardEvent): void => {
        if (event.key === 'Escape') {
            this.close();
        }
    };
}

/**
 * Factory function for creating and opening an edit task modal
 * Provides a simpler API for one-off modal usage
 */
export function openEditTaskModal(options: EditTaskModalOptions): EditTaskModal {
    const modal = new EditTaskModal(options);
    modal.open();
    return modal;
}
