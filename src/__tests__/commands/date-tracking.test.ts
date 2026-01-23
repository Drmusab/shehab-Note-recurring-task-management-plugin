import { describe, it, expect } from 'vitest';
import { DEFAULT_SETTINGS } from '@/core/settings/PluginSettings';

describe('Date Tracking Settings', () => {
  describe('default settings behavior', () => {
    it('should have autoAddDone enabled by default', () => {
      expect(DEFAULT_SETTINGS.dates.autoAddDone).toBe(true);
    });

    it('should have autoAddCancelled enabled by default', () => {
      expect(DEFAULT_SETTINGS.dates.autoAddCancelled).toBe(true);
    });

    it('should have autoAddCreated disabled by default', () => {
      expect(DEFAULT_SETTINGS.dates.autoAddCreated).toBe(false);
    });

    it('should have dates tracking settings defined', () => {
      expect(DEFAULT_SETTINGS.dates).toBeDefined();
      expect(typeof DEFAULT_SETTINGS.dates.autoAddDone).toBe('boolean');
      expect(typeof DEFAULT_SETTINGS.dates.autoAddCancelled).toBe('boolean');
      expect(typeof DEFAULT_SETTINGS.dates.autoAddCreated).toBe('boolean');
    });
  });
});
