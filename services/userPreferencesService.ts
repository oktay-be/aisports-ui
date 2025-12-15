/**
 * User Preferences Service
 * 
 * Handles loading and saving user preferences from/to GCS via the backend API.
 * Preferences are stored per-user using email hash as the folder identifier.
 */

import { ScraperRegionConfig, ScraperSource } from '../scraper-config';

// Scraper config stored per user (keywords, sources, scrapeDepth for each region)
export interface UserScraperConfig {
  eu: ScraperRegionConfig;
  tr: ScraperRegionConfig;
}

// User preferences structure stored in GCS
export interface UserPreferences {
  lastScraperConfig?: {
    region: string;
    maxArticles: number;
    searchType: string;
    dateRange?: {
      from: string;
      to: string;
    };
  };
  scraperConfig?: UserScraperConfig;
  feedFilter?: 'my' | 'all' | string; // 'my' = my feeds, 'all' = all feeds, string = specific user email
  savedAt?: string;
}

// Default preferences for new users
export const DEFAULT_PREFERENCES: UserPreferences = {
  lastScraperConfig: {
    region: 'tr',
    maxArticles: 50,
    searchType: 'recent',
  },
  feedFilter: 'my',
};

/**
 * Load user preferences from the backend
 * @param token - Google OAuth access token
 * @returns User preferences or default preferences if not found
 */
export async function loadPreferences(token: string): Promise<UserPreferences> {
  try {
    const response = await fetch('/api/user/preferences', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 404) {
      // No preferences found, return defaults
      console.log('No saved preferences found, using defaults');
      return DEFAULT_PREFERENCES;
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to load preferences');
    }

    const data = await response.json();
    // Server returns the full preferences object directly
    return {
      ...DEFAULT_PREFERENCES,
      scraperConfig: data.scraperConfig,
      feedFilter: data.feedSettings?.feedFilter || DEFAULT_PREFERENCES.feedFilter,
    };
  } catch (error) {
    console.error('Error loading preferences:', error);
    // Return defaults on error
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Save user preferences to the backend
 * @param token - Google OAuth access token
 * @param preferences - Preferences to save
 * @returns Success status
 */
export async function savePreferences(
  token: string,
  preferences: UserPreferences
): Promise<boolean> {
  try {
    const response = await fetch('/api/user/preferences', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scraperConfig: preferences.scraperConfig,
        feedSettings: {
          feedFilter: preferences.feedFilter,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save preferences');
    }

    console.log('Preferences saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving preferences:', error);
    return false;
  }
}

/**
 * Update specific preference fields (merges with existing)
 * @param token - Google OAuth access token
 * @param updates - Partial preferences to update
 * @returns Updated preferences
 */
export async function updatePreferences(
  token: string,
  updates: Partial<UserPreferences>
): Promise<UserPreferences> {
  // Load existing preferences
  const current = await loadPreferences(token);
  
  // Merge updates
  const updated: UserPreferences = {
    ...current,
    ...updates,
    // Deep merge for lastScraperConfig
    lastScraperConfig: updates.lastScraperConfig 
      ? { ...current.lastScraperConfig, ...updates.lastScraperConfig }
      : current.lastScraperConfig,
    // Deep merge for scraperConfig
    scraperConfig: updates.scraperConfig || current.scraperConfig,
  };
  
  // Save merged preferences
  await savePreferences(token, updated);
  
  return updated;
}

/**
 * Save scraper config with debounce (auto-save on change)
 */
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export function saveScraperConfigDebounced(
  token: string,
  scraperConfig: UserScraperConfig,
  delay: number = 500
): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  saveTimeout = setTimeout(async () => {
    try {
      await savePreferences(token, { scraperConfig });
      console.log('Scraper config auto-saved');
    } catch (error) {
      console.error('Failed to auto-save scraper config:', error);
    }
  }, delay);
}
