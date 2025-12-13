import React, { useState } from 'react';
import { DEFAULT_SCRAPER_CONFIG, ScraperRegionConfig } from '../scraper-config';

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
);

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
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
}) => {
  const enabledCount = config.sources.filter(s => s.enabled).length;

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
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
              Sources
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {config.sources.map((source) => (
                <div
                  key={source.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    source.enabled
                      ? 'bg-slate-800 border-slate-600 hover:border-slate-500'
                      : 'bg-slate-900/50 border-slate-800 opacity-50 hover:opacity-75'
                  }`}
                  onClick={() => onToggleSource(source.id)}
                >
                  <input
                    type="checkbox"
                    checked={source.enabled}
                    onChange={() => {}}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{source.name}</p>
                    <p className="text-xs text-slate-500 truncate">{source.url}</p>
                  </div>
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

export const ScraperTrigger: React.FC = () => {
  const [euConfig, setEuConfig] = useState(DEFAULT_SCRAPER_CONFIG.eu);
  const [trConfig, setTrConfig] = useState(DEFAULT_SCRAPER_CONFIG.tr);
  const [expandedRegion, setExpandedRegion] = useState<'eu' | 'tr' | null>(null);
  const [triggering, setTriggering] = useState<'eu' | 'tr' | null>(null);
  const [euKeywordsInput, setEuKeywordsInput] = useState(DEFAULT_SCRAPER_CONFIG.eu.keywords.join(', '));
  const [trKeywordsInput, setTrKeywordsInput] = useState(DEFAULT_SCRAPER_CONFIG.tr.keywords.join(', '));

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
      // Call the API endpoint to trigger Cloud Function via Pub/Sub
      const response = await fetch('/api/trigger-scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      />
    </div>
  );
};
