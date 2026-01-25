import { randomBytes, createHash } from 'crypto';
import { KeyStore } from './KeyStore';
import { WebhookError } from '../webhook/types/Error';

export interface ApiKey {
  /** Key ID (for reference) */
  id: string;

  /** Workspace this key belongs to */
  workspaceId: string;

  /** Hashed API key (never store plaintext) */
  keyHash: string;

  /** User-friendly label */
  label: string;

  /** Creation timestamp */
  createdAt: string;

  /** Last used timestamp */
  lastUsedAt: string | null;

  /** Whether key is revoked */
  revoked: boolean;

  /** Revocation timestamp */
  revokedAt: string | null;
}

/**
 * API Key manager
 */
export class ApiKeyManager {
  constructor(private keyStore: KeyStore) {}

  /**
   * Generate new API key for workspace
   */
  async createKey(workspaceId: string, label: string): Promise<string> {
    // Generate key: rtm_<workspace>_<32_random_chars>
    const randomPart = randomBytes(16).toString('hex'); // 32 hex chars
    const plainKey = `rtm_${workspaceId}_${randomPart}`;

    // Hash for storage
    const keyHash = this.hashKey(plainKey);

    const apiKey: ApiKey = {
      id: this.generateId(),
      workspaceId,
      keyHash,
      label,
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      revoked: false,
      revokedAt: null,
    };

    await this.keyStore.saveKey(apiKey);

    // Return plaintext key ONLY on creation
    return plainKey;
  }

  /**
   * Validate API key and return workspace ID
   */
  async validateKey(plainKey: string): Promise<{ workspaceId: string; keyId: string }> {
    // Extract workspace from key format
    const match = plainKey.match(/^rtm_([^_]+)_([a-f0-9]{32})$/);
    if (!match) {
      throw new WebhookError('UNAUTHORIZED', 'Invalid API key format');
    }

    const workspaceId = match[1];
    const keyHash = this.hashKey(plainKey);

    const apiKey = await this.keyStore.findKeyByHash(keyHash);

    if (!apiKey) {
      throw new WebhookError('UNAUTHORIZED', 'Invalid API key');
    }

    if (apiKey.revoked) {
      throw new WebhookError('UNAUTHORIZED', 'API key has been revoked');
    }

    if (apiKey.workspaceId !== workspaceId) {
      throw new WebhookError('UNAUTHORIZED', 'API key workspace mismatch');
    }

    // Update last used timestamp
    await this.keyStore.updateLastUsed(apiKey.id);

    return { workspaceId: apiKey.workspaceId, keyId: apiKey.id };
  }

  /**
   * List all keys for workspace (without plaintext keys)
   */
  async listKeys(workspaceId: string): Promise<Omit<ApiKey, 'keyHash'>[]> {
    const keys = await this.keyStore.listKeysByWorkspace(workspaceId);
    
    return keys.map((key) => {
      const { keyHash, ...rest } = key;
      return rest;
    });
  }

  /**
   * Revoke API key
   */
  async revokeKey(keyId: string, workspaceId: string): Promise<void> {
    const key = await this.keyStore.getKey(keyId);

    if (!key) {
      throw new WebhookError('NOT_FOUND', 'API key not found');
    }

    if (key.workspaceId !== workspaceId) {
      throw new WebhookError('FORBIDDEN', 'Cannot revoke key from different workspace');
    }

    await this.keyStore.revokeKey(keyId);
  }

  /**
   * Rotate API key (create new, revoke old)
   */
  async rotateKey(keyId: string, workspaceId: string): Promise<string> {
    const oldKey = await this.keyStore.getKey(keyId);

    if (!oldKey) {
      throw new WebhookError('NOT_FOUND', 'API key not found');
    }

    if (oldKey.workspaceId !== workspaceId) {
      throw new WebhookError('FORBIDDEN', 'Cannot rotate key from different workspace');
    }

    // Create new key with same label
    const newPlainKey = await this.createKey(workspaceId, oldKey.label);

    // Revoke old key
    await this.keyStore.revokeKey(keyId);

    return newPlainKey;
  }

  /**
   * Hash API key for storage
   */
  private hashKey(plainKey: string): string {
    return createHash('sha256').update(plainKey).digest('hex');
  }

  /**
   * Generate unique key ID
   */
  private generateId(): string {
    return `key_${randomBytes(12).toString('hex')}`;
  }
}
