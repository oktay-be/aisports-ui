/**
 * Tests for userPreferencesService.
 *
 * Tests the user preferences service with mocked GCS API calls.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as gcsApi from '../../services/gcsApiService';
import {
  loadPreferences,
  savePreferences,
  updatePreferences,
  DEFAULT_PREFERENCES,
  UserPreferences,
} from '../../services/userPreferencesService';

// Mock the gcsApiService module
vi.mock('../../services/gcsApiService');

describe('userPreferencesService', () => {
  const mockToken = 'mock-oauth-token';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadPreferences', () => {
    it('should return preferences from GCS API', async () => {
      const mockApiResponse = {
        scraperConfig: {
          eu: { id: 'eu', name: 'Europe', keywords: ['football'], sources: [], scrapeDepth: 3 },
          tr: { id: 'tr', name: 'Turkey', keywords: ['futbol'], sources: [], scrapeDepth: 3 },
        },
        feedSettings: {
          feedFilter: 'all',
        },
      };

      vi.mocked(gcsApi.getPreferences).mockResolvedValue(mockApiResponse as any);

      const result = await loadPreferences(mockToken);

      expect(gcsApi.getPreferences).toHaveBeenCalledWith(mockToken);
      expect(result.scraperConfig).toEqual(mockApiResponse.scraperConfig);
      expect(result.feedFilter).toBe('all');
    });

    it('should return default preferences when API fails', async () => {
      vi.mocked(gcsApi.getPreferences).mockRejectedValue(new Error('API error'));

      const result = await loadPreferences(mockToken);

      expect(result).toEqual(DEFAULT_PREFERENCES);
    });

    it('should merge with defaults for missing fields', async () => {
      const mockApiResponse = {
        scraperConfig: null,
        feedSettings: {},
      };

      vi.mocked(gcsApi.getPreferences).mockResolvedValue(mockApiResponse as any);

      const result = await loadPreferences(mockToken);

      expect(result.feedFilter).toBe(DEFAULT_PREFERENCES.feedFilter);
      expect(result.lastScraperConfig).toEqual(DEFAULT_PREFERENCES.lastScraperConfig);
    });
  });

  describe('savePreferences', () => {
    it('should save preferences via GCS API', async () => {
      vi.mocked(gcsApi.savePreferences).mockResolvedValue(undefined);

      const preferences: UserPreferences = {
        feedFilter: 'my',
        scraperConfig: {
          eu: { id: 'eu', name: 'Europe', keywords: ['test'], sources: [], scrapeDepth: 2 } as any,
          tr: { id: 'tr', name: 'Turkey', keywords: ['test'], sources: [], scrapeDepth: 2 } as any,
        },
      };

      const result = await savePreferences(mockToken, preferences);

      expect(result).toBe(true);
      expect(gcsApi.savePreferences).toHaveBeenCalledWith(mockToken, {
        scraperConfig: preferences.scraperConfig,
        feedSettings: {
          feedFilter: preferences.feedFilter,
        },
      });
    });

    it('should return false on API error', async () => {
      vi.mocked(gcsApi.savePreferences).mockRejectedValue(new Error('API error'));

      const result = await savePreferences(mockToken, { feedFilter: 'all' });

      expect(result).toBe(false);
    });

    it('should handle null scraperConfig', async () => {
      vi.mocked(gcsApi.savePreferences).mockResolvedValue(undefined);

      const preferences: UserPreferences = {
        feedFilter: 'my',
      };

      const result = await savePreferences(mockToken, preferences);

      expect(result).toBe(true);
      expect(gcsApi.savePreferences).toHaveBeenCalledWith(mockToken, {
        scraperConfig: null,
        feedSettings: {
          feedFilter: 'my',
        },
      });
    });
  });

  describe('updatePreferences', () => {
    it('should merge updates with existing preferences', async () => {
      const existingPrefs = {
        scraperConfig: null,
        feedSettings: {
          feedFilter: 'my',
        },
      };

      vi.mocked(gcsApi.getPreferences).mockResolvedValue(existingPrefs as any);
      vi.mocked(gcsApi.savePreferences).mockResolvedValue(undefined);

      const updates = {
        feedFilter: 'all' as const,
      };

      const result = await updatePreferences(mockToken, updates);

      expect(result.feedFilter).toBe('all');
      expect(gcsApi.savePreferences).toHaveBeenCalled();
    });

    it('should deep merge lastScraperConfig', async () => {
      const existingPrefs = {
        scraperConfig: null,
        feedSettings: {
          feedFilter: 'my',
        },
      };

      vi.mocked(gcsApi.getPreferences).mockResolvedValue(existingPrefs as any);
      vi.mocked(gcsApi.savePreferences).mockResolvedValue(undefined);

      const updates = {
        lastScraperConfig: {
          maxArticles: 100,
        } as any,
      };

      const result = await updatePreferences(mockToken, updates);

      // Should merge with default lastScraperConfig
      expect(result.lastScraperConfig?.maxArticles).toBe(100);
      expect(result.lastScraperConfig?.region).toBe(DEFAULT_PREFERENCES.lastScraperConfig?.region);
    });
  });

  describe('DEFAULT_PREFERENCES', () => {
    it('should have expected default values', () => {
      expect(DEFAULT_PREFERENCES.feedFilter).toBe('my');
      expect(DEFAULT_PREFERENCES.lastScraperConfig?.region).toBe('tr');
      expect(DEFAULT_PREFERENCES.lastScraperConfig?.maxArticles).toBe(50);
      expect(DEFAULT_PREFERENCES.lastScraperConfig?.searchType).toBe('recent');
    });
  });
});
