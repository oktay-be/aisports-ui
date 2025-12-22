import React, { useState, useEffect } from 'react';
import { loadPreferences } from '../services/userPreferencesService';
import { DEFAULT_SCRAPER_CONFIG } from '../scraper-config';
import * as gcsApi from '../services/gcsApiService';

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
);

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
);

interface FetcherTriggerProps {
  token?: string;
}

// Merge and deduplicate keywords from EU and TR defaults
const getDefaultMergedKeywords = () => {
  const euKeywords = DEFAULT_SCRAPER_CONFIG.eu.keywords;
  const trKeywords = DEFAULT_SCRAPER_CONFIG.tr.keywords;
  return [...new Set([...euKeywords, ...trKeywords])].sort().join(', ');
};

export const FetcherTrigger: React.FC<FetcherTriggerProps> = ({ token }) => {
  const [keywordsInput, setKeywordsInput] = useState(getDefaultMergedKeywords());
  const [isExpanded, setIsExpanded] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // Load and merge keywords from user preferences
  useEffect(() => {
    if (!token) return;

    const loadUserKeywords = async () => {
      try {
        const prefs = await loadPreferences(token);
        
        // Use preferences keywords if available, otherwise keep defaults
        const euKeywords = prefs.scraperConfig?.eu?.keywords || DEFAULT_SCRAPER_CONFIG.eu.keywords;
        const trKeywords = prefs.scraperConfig?.tr?.keywords || DEFAULT_SCRAPER_CONFIG.tr.keywords;
        
        // Merge and deduplicate keywords from both regions
        const merged = [...new Set([...euKeywords, ...trKeywords])].sort();
        setKeywordsInput(merged.join(', '));
        console.log('Merged keywords for fetcher:', merged);
      } catch (error) {
        console.error('Failed to load user preferences:', error);
        // Keep default keywords on error
      } finally {
        setPreferencesLoaded(true);
      }
    };

    loadUserKeywords();
  }, [token]);

  const handleTrigger = async () => {
    if (!token) return;
    
    setTriggering(true);
    
    // Parse keywords from input
    const allKeywords = keywordsInput
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    try {
      const result = await gcsApi.triggerNewsApi(token, {
        keywords: allKeywords,
        time_range: 'last_24_hours',
        max_results: 50,
      });

      console.log('✅ API Fetcher triggered successfully:', result);
      alert(`✅ API Fetcher triggered!\n\nKeywords: ${allKeywords.join(', ')}\nMessage ID: ${result.messageId}\n\nCheck Cloud Functions logs for execution.`);
    } catch (error: any) {
      console.error('Failed to trigger API fetcher:', error);
      alert(`❌ Failed to trigger API Fetcher:\n${error.message}`);
    } finally {
      setTriggering(false);
    }
  };

  const keywordCount = keywordsInput.split(',').filter(k => k.trim().length > 0).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white">API Fetcher Control</h2>
          <p className="text-xs text-slate-400">Fetch news from external APIs using your saved keywords</p>
        </div>
      </div>

      <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-900/50">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <div>
              <h3 className="font-bold text-white">News API Fetcher</h3>
              <p className="text-xs text-slate-400">
                {preferencesLoaded 
                  ? `${keywordCount} keywords configured`
                  : 'Loading preferences...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTrigger();
              }}
              disabled={keywordCount === 0 || triggering || !preferencesLoaded}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {triggering ? (
                <>Triggering...</>
              ) : (
                <>
                  <PlayIcon />
                  Fetch News
                </>
              )}
            </button>
            <div className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              <ChevronDownIcon />
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-slate-700 p-4 space-y-4">
            {/* Keywords Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Keywords (comma-separated)
              </label>
              {!preferencesLoaded ? (
                <div className="text-sm text-slate-500">Loading...</div>
              ) : (
                <input
                  type="text"
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                  placeholder="fenerbahce, galatasaray, ..."
                />
              )}
              <p className="text-xs text-slate-500 mt-2">
                Edit keywords here for this run. Changes are temporary and won't be saved to preferences.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
