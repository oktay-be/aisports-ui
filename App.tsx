import React, { useState, useEffect, useMemo } from 'react';
import { NewsEntry, PostStatus, FilterState, GeminiAnalysis } from './types';
import { fetchNews } from './services/dataService';
import { analyzeNewsBatch } from './services/geminiService';

// --- Icons ---
const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
);
const ExternalLinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
);
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);
const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>
);
const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
);

const App: React.FC = () => {
  const [entries, setEntries] = useState<NewsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<GeminiAnalysis | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    startDate: '',
    endDate: '',
    status: 'ALL'
  });

  // Initial Fetch
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchNews();
      setEntries(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Filtering Logic
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = entry.content.toLowerCase().includes(filters.search.toLowerCase()) || 
                            entry.source.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesStatus = filters.status === 'ALL' ? true : entry.status === filters.status;
      
      let matchesDate = true;
      if (filters.startDate) {
        matchesDate = matchesDate && new Date(entry.timestamp) >= new Date(filters.startDate);
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59);
        matchesDate = matchesDate && new Date(entry.timestamp) <= end;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [entries, filters]);

  // Actions
  const handlePost = (id: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, status: PostStatus.POSTED } : e));
  };

  const handleDiscard = (id: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, status: PostStatus.DISCARDED } : e));
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    const result = await analyzeNewsBatch(filteredEntries);
    setAnalysis(result);
    setAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans pb-20">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900 sticky top-0 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              NP
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">NewsPulse</h1>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-xs text-slate-500">GCP Bucket: gs://news-scraper-prod</span>
             <button onClick={loadData} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
               <RefreshIcon />
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Controls & Analysis Bar */}
        <div className="mb-8 space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-800">
            
            {/* Search & Filters */}
            <div className="flex flex-wrap gap-3 flex-1 w-full md:w-auto">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search content or source..." 
                  className="bg-slate-950 border border-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 p-2.5 placeholder-slate-500 text-white"
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                />
              </div>
              <select 
                className="bg-slate-950 border border-slate-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value as any})}
              >
                <option value="ALL">All Status</option>
                <option value={PostStatus.PENDING}>Pending</option>
                <option value={PostStatus.POSTED}>Posted</option>
                <option value={PostStatus.DISCARDED}>Discarded</option>
              </select>
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2">
                <input 
                  type="date" 
                  className="bg-transparent text-sm text-slate-300 focus:outline-none [color-scheme:dark]"
                  value={filters.startDate}
                  onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                />
                <span className="text-slate-600">-</span>
                <input 
                  type="date" 
                  className="bg-transparent text-sm text-slate-300 focus:outline-none [color-scheme:dark]"
                  value={filters.endDate}
                  onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                />
              </div>
            </div>

            {/* AI Action */}
            <button 
              onClick={runAnalysis}
              disabled={analyzing}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-900/20"
            >
              {analyzing ? (
                <>Analyzing...</>
              ) : (
                <>
                  <SparklesIcon />
                  Analyze View
                </>
              )}
            </button>
          </div>

          {/* Analysis Result Deck */}
          {analysis && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
              <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl">
                <h3 className="text-slate-400 text-xs uppercase font-semibold tracking-wider mb-2">Narrative Summary</h3>
                <p className="text-slate-200 text-sm leading-relaxed">{analysis.summary}</p>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl">
                <h3 className="text-slate-400 text-xs uppercase font-semibold tracking-wider mb-2">Sentiment Pulse</h3>
                <div className="flex items-center gap-3 mt-3">
                  <div className={`text-2xl font-bold ${analysis.sentiment === 'Positive' ? 'text-green-400' : analysis.sentiment === 'Negative' ? 'text-red-400' : 'text-yellow-400'}`}>
                    {analysis.sentiment}
                  </div>
                  <div className="h-2 flex-1 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${analysis.sentiment === 'Positive' ? 'bg-green-500 w-3/4' : analysis.sentiment === 'Negative' ? 'bg-red-500 w-3/4' : 'bg-yellow-500 w-1/2'}`}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl">
                <h3 className="text-slate-400 text-xs uppercase font-semibold tracking-wider mb-2">Suggested Hashtags</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {analysis.trendingTags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/20">
                      #{tag.replace('#', '')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content Grid */}
        {loading ? (
           <div className="flex items-center justify-center h-64 text-slate-500">Loading entries from bucket...</div>
        ) : (
          <>
             <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">
                  Feed <span className="ml-2 px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded-full">{filteredEntries.length}</span>
                </h2>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredEntries.map(entry => (
                <NewsCard 
                  key={entry.id} 
                  entry={entry} 
                  onPost={handlePost} 
                  onDiscard={handleDiscard} 
                />
              ))}
             </div>

             {filteredEntries.length === 0 && (
               <div className="text-center py-20 text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800 border-dashed">
                 No entries found matching your filters.
               </div>
             )}
          </>
        )}
      </main>
    </div>
  );
};

const NewsCard: React.FC<{
  entry: NewsEntry;
  onPost: (id: string) => void;
  onDiscard: (id: string) => void;
}> = ({ entry, onPost, onDiscard }) => {
  const isPosted = entry.status === PostStatus.POSTED;
  const isDiscarded = entry.status === PostStatus.DISCARDED;
  
  // Calculate relative time simple
  const timeAgo = (dateString: string) => {
    const diff = (new Date().getTime() - new Date(dateString).getTime()) / 1000 / 60 / 60;
    if (diff < 1) return '< 1h ago';
    if (diff < 24) return `${Math.floor(diff)}h ago`;
    return `${Math.floor(diff / 24)}d ago`;
  };

  return (
    <div className={`
      relative group flex flex-col justify-between
      bg-slate-900 border border-slate-800 rounded-xl p-5 transition-all duration-200
      ${isPosted ? 'opacity-60 grayscale-[0.5]' : 'hover:border-slate-600 hover:shadow-xl hover:shadow-slate-900/50'}
      ${isDiscarded ? 'opacity-40' : ''}
    `}>
      {/* Status Badge */}
      {entry.status !== PostStatus.PENDING && (
        <div className={`absolute -top-2 -right-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded shadow-sm ${
          isPosted ? 'bg-green-900 text-green-200 border border-green-800' : 'bg-red-900 text-red-200 border border-red-800'
        }`}>
          {entry.status}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
              {entry.source}
            </span>
            <span className="text-xs text-slate-500">{timeAgo(entry.timestamp)}</span>
          </div>
          <a 
            href={entry.originalUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-blue-400 transition-colors"
            title="View Original Source"
          >
            <ExternalLinkIcon />
          </a>
        </div>

        <p className="text-slate-200 text-sm leading-relaxed mb-4 font-medium">
          {entry.content}
        </p>
      </div>

      <div className="pt-4 border-t border-slate-800/50 flex items-center justify-between">
        <span className={`text-xs font-mono ${entry.characterCount > 140 ? 'text-red-400' : 'text-slate-500'}`}>
          {entry.characterCount}/140
        </span>

        {!isPosted && !isDiscarded && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onDiscard(entry.id)}
              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
              title="Discard"
            >
              <XIcon />
            </button>
            <button 
              onClick={() => onPost(entry.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-white text-slate-900 text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              <CheckIcon />
              Post
            </button>
          </div>
        )}
        
        {isPosted && (
           <span className="text-xs text-green-500 font-medium flex items-center gap-1">
             Posted
             <CheckIcon />
           </span>
        )}
      </div>
    </div>
  );
};

export default App;
