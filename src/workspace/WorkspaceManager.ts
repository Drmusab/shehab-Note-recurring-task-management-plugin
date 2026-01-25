import { WorkspaceStore } from './WorkspaceStore';
import { WebhookError } from '../webhook/types/Error';

export interface Workspace {
  /** Unique workspace identifier */
  id: string;

  /** Display name */
  displayName: string;

  /** Color for UI */
  color: string;

  /** Icon emoji */
  icon: string;

  /** Workspace settings */
  settings: WorkspaceSettings;

  /** Creation timestamp */
  createdAt: string;
}

export interface WorkspaceSettings {
  /** Default notification advance time (seconds) */
  defaultNotificationAdvance: number;

  /** Timezone */
  timezone: string;

  /** Week starts on */
  weekStartsOn: 'monday' | 'sunday';
}

/**
 * Workspace manager
 */
export class WorkspaceManager {
  constructor(private store: WorkspaceStore) {}

  /**
   * Create new workspace
   */
  async createWorkspace(
    id: string,
    displayName: string,
    options?: Partial<Omit<Workspace, 'id' | 'createdAt'>>
  ): Promise<Workspace> {
    // Validate ID format (alphanumeric + hyphens)
    if (!/^[a-z0-9-]+$/.test(id)) {
      throw new WebhookError(
        'VALIDATION_ERROR',
        'Workspace ID must be lowercase alphanumeric with hyphens',
        { id }
      );
    }

    // Check if exists
    const existing = await this.store.getWorkspace(id);
    if (existing) {
      throw new WebhookError('CONFLICT', 'Workspace ID already exists', { id });
    }

    const workspace: Workspace = {
      id,
      displayName,
      color: options?.color || '#2196F3',
      icon: options?.icon || '📋',
      settings: options?.settings || {
        defaultNotificationAdvance: 3600,
        timezone: 'UTC',
        weekStartsOn: 'monday',
      },
      createdAt: new Date().toISOString(),
    };

    await this.store.saveWorkspace(workspace);
    return workspace;
  }

  /**
   * Get workspace by ID
   */
  async getWorkspace(id: string): Promise<Workspace> {
    const workspace = await this.store.getWorkspace(id);
    if (!workspace) {
      throw new WebhookError('NOT_FOUND', 'Workspace not found', { id });
    }
    return workspace;
  }

  /**
   * List all workspaces
   */
  async listWorkspaces(): Promise<Workspace[]> {
    return this.store.listWorkspaces();
  }

  /**
   * Update workspace configuration
   */
  async updateWorkspace(
    id: string,
    updates: Partial<Omit<Workspace, 'id' | 'createdAt'>>
  ): Promise<Workspace> {
    const workspace = await this.getWorkspace(id);

    const updated: Workspace = {
      ...workspace,
      ...updates,
      id: workspace.id, // Prevent ID change
      createdAt: workspace.createdAt, // Prevent timestamp change
    };

    await this.store.saveWorkspace(updated);
    return updated;
  }

  /**
   * Delete workspace
   */
  async deleteWorkspace(id: string): Promise<void> {
    await this.store.deleteWorkspace(id);
  }
}
