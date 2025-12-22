/**
 * User Preferences Service
 * 
 * Handles loading and saving user preferences from/to GCS via the GCS API Cloud Function.
 * Preferences are stored per-user using email hash as the folder identifier.
 */

import { ScraperRegionConfig, ScraperSource } from '../scraper-config';
import * as gcsApi from './gcsApiService';

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
      string;
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
 * Load user preferences from the GCS API
 * @param token - Google OAuth access token
 * @returns User preferences or default preferences if not found
 */
export async function loadPreferences(token: string): Promise<UserPreferences> {
  try {
    const data = await gcsApi.getPreferences(token);
    
    // Map API response to UserPreferences format
    return {
      ...DEFAULT_PREFERENCES,
      scraperConfig: data.scraperConfig || undefined,
      feedFilter: data.feedSettings?.feedFilter || DEFAULT_PREFERENCES.feedFilter,
    };
  } catch (error) {
    console.error('Error loading preferences:', error);
    // Return defaults on error
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Save user preferences to the GCS API
 * @param token - Google OAuth access token
 * @param preferences - Preferences to save
 * @returns Success status
 */
export async function savePreferences(
  token: string,
  preferences: UserPreferences
): Promise<boolean> {
  try {
    await gcsApi.savePreferences(token, {
      scraperConfig: preferences.scraperConfig || null,
      feedSettings: {
        feedFilter: preferences.feedFilter,
      },
    });

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
