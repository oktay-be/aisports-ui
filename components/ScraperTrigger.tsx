import React, { useState, useEffect } from 'react';
import { DEFAULT_SCRAPER_CONFIG, ScraperRegionConfig } from '../scraper-config';
import { loadPreferences, savePreferences, UserPreferences } from '../services/userPreferencesService';

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
);

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
);

interface RegionPanelProps {
  config: ScraperRegionConfig;
  region: 'eu' | 'tr';
  isExpanded: boolean;
  triggering: boolean;
  keywordsInput: string;
  onToggleExpand: () => void;
  onTrigger: () => void;
  onToggleSource: (sourceId: string) => void;
  onUpdateKeywords: (value: string) => void;
  onUpdateScrapeDepth: (depth: number) => void;
  onAddSource: (name: string, url: string) => void;
  onDeleteSource: (sourceId: string) => void;
}

const RegionPanel: React.FC<RegionPanelProps> = ({
  config,
  region,
  isExpanded,
  triggering,
  keywordsInput,
  onToggleExpand,
  onTrigger,
  onToggleSource,
  onUpdateKeywords,
  onUpdateScrapeDepth,
  onAddSource,
  onDeleteSource,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const enabledCount = config.sources.filter(s => s.enabled).length;

  const handleAddSource = () => {
    if (newSourceName.trim() && newSourceUrl.trim()) {
      onAddSource(newSourceName.trim(), newSourceUrl.trim());
      setNewSourceName('');
      setNewSourceUrl('');
      setShowAddForm(false);
    }
  };

  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-900/50">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/50 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${region === 'eu' ? 'bg-blue-500' : 'bg-orange-500'}`} />
          <div>
            <h3 className="font-bold text-white">{config.name}</h3>
            <p className="text-xs text-slate-400">{enabledCount}/{config.sources.length} sources enabled</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTrigger();
            }}
            disabled={enabledCount === 0 || triggering}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {triggering ? (
              <>Triggering...</>
            ) : (
              <>
                <PlayIcon />
                Trigger
              </>
            )}
          </button>
          <div className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            <ChevronDownIcon />
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-700 p-4 space-y-4 animate-fade-in">
          {/* Keywords */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
              Keywords (comma-separated)
            </label>
            <input
              type="text"
              value={keywordsInput}
              onChange={(e) => onUpdateKeywords(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              placeholder="fenerbahce, galatasaray, ..."
            />
          </div>

          {/* Sources */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase">
                Sources
              </label>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddForm(!showAddForm);
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition-colors"
              >
                <PlusIcon />
                Add Source
              </button>
            </div>

            {/* Add Source Form */}
            {showAddForm && (
              <div className="mb-3 p-3 bg-slate-800 rounded-lg border border-slate-700 space-y-2">
                <input
                  type="text"
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="Source name (e.g., ESPN)"
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="URL (e.g., https://www.espn.com/)"
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddSource();
                    }}
                    disabled={!newSourceName.trim() || !newSourceUrl.trim()}
                    className="flex-1 px-3 py-1.5 text-xs bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAddForm(false);
                      setNewSourceName('');
                      setNewSourceUrl('');
                    }}
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {config.sources.map((source) => (
                <div
                  key={source.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    source.enabled
                      ? 'bg-slate-800 border-slate-600 hover:border-slate-500'
                      : 'bg-slate-900/50 border-slate-800 opacity-50 hover:opacity-75'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={source.enabled}
                    onChange={() => onToggleSource(source.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                  />
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => onToggleSource(source.id)}
                  >
                    <p className="text-sm font-medium text-white truncate">{source.name}</p>
                    <p className="text-xs text-slate-500 truncate">{source.url}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete "${source.name}"?`)) {
                        onDeleteSource(source.id);
                      }
                    }}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                    title="Delete source"
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Advanced Settings */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
              Scrape Depth
            </label>
            <select
              value={config.scrapeDepth}
              onChange={(e) => onUpdateScrapeDepth(parseInt(e.target.value))}
              className="bg-slate-950 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value={1}>1 (Fast)</option>
              <option value={2}>2 (Balanced)</option>
              <option value={3}>3 (Deep)</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export const ScraperTrigger: React.FC<{ token?: string }> = ({ token }) => {
  const [euConfig, setEuConfig] = useState(DEFAULT_SCRAPER_CONFIG.eu);
  const [trConfig, setTrConfig] = useState(DEFAULT_SCRAPER_CONFIG.tr);
  const [expandedRegion, setExpandedRegion] = useState<'eu' | 'tr' | null>(null);
  const [triggering, setTriggering] = useState<'eu' | 'tr' | null>(null);
  const [euKeywordsInput, setEuKeywordsInput] = useState(DEFAULT_SCRAPER_CONFIG.eu.keywords.join(', '));
  const [trKeywordsInput, setTrKeywordsInput] = useState(DEFAULT_SCRAPER_CONFIG.tr.keywords.join(', '));
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // Load user preferences on mount
  useEffect(() => {
    if (!token) return;
    
    const loadUserPreferences = async () => {
      const prefs = await loadPreferences(token);
      if (prefs.lastScraperConfig) {
        // Apply saved preferences if available
        // Note: For now we just mark as loaded. 
        // Full config restoration could be added later.
        console.log('User preferences loaded:', prefs);
      }
      setPreferencesLoaded(true);
    };
    
    loadUserPreferences();
  }, [token]);

  const handleTrigger = async (region: 'eu' | 'tr') => {
    setTriggering(region);
    
    const config = region === 'eu' ? euConfig : trConfig;
    const enabledSources = config.sources.filter(s => s.enabled);
    
    const payload = {
      keywords: config.keywords,
      urls: enabledSources.map(s => s.url),
      scrape_depth: config.scrapeDepth,
      persist: false,
      log_level: 'INFO',
      collection_id: region,
    };

    try {
      // Build headers with auth token
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Call the API endpoint to trigger Cloud Function via Pub/Sub
      const response = await fetch('/api/trigger-scraper', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ Scraper triggered successfully:`, result);
      alert(`✅ ${region.toUpperCase()} scraper triggered!\n\nMessage ID: ${result.messageId}\nSources: ${result.sourcesCount}\n\nCheck Cloud Functions logs for execution.`);
    } catch (error) {
      console.error('Failed to trigger scraper:', error);
      alert(`❌ Failed to trigger ${region.toUpperCase()} scraper:\n${error.message}`);
    } finally {
      setTriggering(null);
    }
  };

  const toggleSource = (region: 'eu' | 'tr', sourceId: string) => {
    const setter = region === 'eu' ? setEuConfig : setTrConfig;
    const config = region === 'eu' ? euConfig : trConfig;
    
    setter({
      ...config,
      sources: config.sources.map(s =>
        s.id === sourceId ? { ...s, enabled: !s.enabled } : s
      ),
    });
  };

  const updateKeywords = (region: 'eu' | 'tr', value: string) => {
    // Update the input display state
    if (region === 'eu') {
      setEuKeywordsInput(value);
    } else {
      setTrKeywordsInput(value);
    }
    
    // Update the config with parsed keywords
    const setter = region === 'eu' ? setEuConfig : setTrConfig;
    const config = region === 'eu' ? euConfig : trConfig;
    
    setter({
      ...config,
      keywords: value.split(',').map(k => k.trim()).filter(Boolean),
    });
  };

  const updateScrapeDepth = (region: 'eu' | 'tr', depth: number) => {
    const setter = region === 'eu' ? setEuConfig : setTrConfig;
    const config = region === 'eu' ? euConfig : trConfig;
    setter({ ...config, scrapeDepth: depth });
  };

  const addSource = (region: 'eu' | 'tr', name: string, url: string) => {
    const setter = region === 'eu' ? setEuConfig : setTrConfig;
    const config = region === 'eu' ? euConfig : trConfig;
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();
    setter({
      ...config,
      sources: [...config.sources, { id, name, url, enabled: true }],
    });
  };

  const deleteSource = (region: 'eu' | 'tr', sourceId: string) => {
    const setter = region === 'eu' ? setEuConfig : setTrConfig;
    const config = region === 'eu' ? euConfig : trConfig;
    setter({
      ...config,
      sources: config.sources.filter(s => s.id !== sourceId),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white">Scraper Control</h2>
          <p className="text-xs text-slate-400">Trigger news scraping for different regions</p>
        </div>
      </div>

      <RegionPanel
        config={euConfig}
        region="eu"
        isExpanded={expandedRegion === 'eu'}
        triggering={triggering === 'eu'}
        keywordsInput={euKeywordsInput}
        onToggleExpand={() => setExpandedRegion(expandedRegion === 'eu' ? null : 'eu')}
        onTrigger={() => handleTrigger('eu')}
        onToggleSource={(sourceId) => toggleSource('eu', sourceId)}
        onUpdateKeywords={(value) => updateKeywords('eu', value)}
        onUpdateScrapeDepth={(depth) => updateScrapeDepth('eu', depth)}
        onAddSource={(name, url) => addSource('eu', name, url)}
        onDeleteSource={(sourceId) => deleteSource('eu', sourceId)}
      />
      <RegionPanel
        config={trConfig}
        region="tr"
        isExpanded={expandedRegion === 'tr'}
        triggering={triggering === 'tr'}
        keywordsInput={trKeywordsInput}
        onToggleExpand={() => setExpandedRegion(expandedRegion === 'tr' ? null : 'tr')}
        onTrigger={() => handleTrigger('tr')}
        onToggleSource={(sourceId) => toggleSource('tr', sourceId)}
        onUpdateKeywords={(value) => updateKeywords('tr', value)}
        onUpdateScrapeDepth={(depth) => updateScrapeDepth('tr', depth)}
        onAddSource={(name, url) => addSource('tr', name, url)}
        onDeleteSource={(sourceId) => deleteSource('tr', sourceId)}
      />
    </div>
  );
};
