/**
 * Type definitions for EditTask component modes
 * 
 * Supports both modal and embedded rendering modes for the EditTask component.
 * Modal mode is used for traditional popup editing, while embedded mode is used
 * for inline editing in split-view layouts.
 */

/**
 * Edit task rendering mode
 * - 'modal': Traditional modal dialog with Apply/Cancel buttons
 * - 'embedded': Inline editing with auto-save (no action buttons)
 */
export type EditTaskMode = 'modal' | 'embedded';

/**
 * Configuration for each edit mode
 */
export interface EditTaskModeConfig {
    /** Whether to show Apply/Cancel buttons */
    showActionButtons: boolean;
    /** Whether to enable auto-save (with debouncing) */
    enableAutoSave: boolean;
    /** Auto-save delay in milliseconds (only applicable when enableAutoSave is true) */
    autoSaveDelayMs: number;
    /** Whether to auto-focus the description field on mount */
    autoFocus: boolean;
    /** Whether to show unsaved changes indicator */
    showUnsavedIndicator: boolean;
}

/**
 * Default configurations for each mode
 */
export const MODE_CONFIGS: Record<EditTaskMode, EditTaskModeConfig> = {
    modal: {
        showActionButtons: true,
        enableAutoSave: false,
        autoSaveDelayMs: 0,
        autoFocus: true,
        showUnsavedIndicator: false,
    },
    embedded: {
        showActionButtons: false,
        enableAutoSave: true,
        autoSaveDelayMs: 500,
        autoFocus: false,
        showUnsavedIndicator: true,
    },
};
