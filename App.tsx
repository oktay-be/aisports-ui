import React, { useState, useEffect, useMemo } from 'react';
import { NewsEntry, PostStatus, FilterState, GeminiAnalysis, SourceRegion } from './types';
import { fetchNews } from './services/dataService';
import { analyzeNewsBatch } from './services/geminiService';
import { ScraperTrigger } from './components/ScraperTrigger';

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
const MessageCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
);
const TwitterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
);
const TranslateIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>
);

const App: React.FC = () => {
  const [entries, setEntries] = useState<NewsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<GeminiAnalysis | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<SourceRegion>('eu');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'feed' | 'scraper'>('feed');

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    startDate: '',
    endDate: '',
    status: 'ALL'
  });

  // Initial Fetch & Date Filter Watch - fetch whenever dates or region change
  useEffect(() => {
    const isSingleDay = filters.startDate && filters.endDate && filters.startDate === filters.endDate;
    if (isSingleDay) {
      loadData(filters.startDate);
    } else if (filters.startDate || filters.endDate) {
      // If any date is set but not a single day, still trigger a fetch
      loadData();
    } else {
      loadData();
    }
  }, [selectedRegion, filters.startDate, filters.endDate]);

  // Auto-refresh every 2 minutes when enabled
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      console.log('Auto-refreshing data...');
      loadData();
    }, 2 * 60 * 1000); // 2 minutes
    
    return () => clearInterval(interval);
  }, [autoRefresh, selectedRegion, filters.startDate, filters.endDate]);

  const loadData = async (date?: string) => {
    setLoading(true);
    try {
      const data = await fetchNews(selectedRegion, date);
      setEntries(data);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Filtering Logic
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = entry.summary.toLowerCase().includes(filters.search.toLowerCase()) || 
                            entry.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                            entry.source.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesStatus = filters.status === 'ALL' ? true : entry.status === filters.status;
      
      // Note: Date filtering is handled by the API (based on scraping date),
      // not here (which would filter by article published_date).
      // Articles scraped on 2025-12-05 might have been published days earlier.

      return matchesSearch && matchesStatus;
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
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                NP
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">NewsPulse</h1>
            </div>
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('feed')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'feed' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Feed
              </button>
              <button
                onClick={() => setActiveTab('scraper')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'scraper' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Scraper
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
               <button 
                 onClick={() => setSelectedRegion('eu')}
                 className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${selectedRegion === 'eu' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
               >
                 EU
               </button>
               <button 
                 onClick={() => setSelectedRegion('tr')}
                 className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${selectedRegion === 'tr' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
               >
                 TR
               </button>
             </div>
             <button 
               onClick={() => setAutoRefresh(!autoRefresh)}
               className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                 autoRefresh 
                   ? 'bg-green-600 text-white hover:bg-green-500' 
                   : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
               }`}
               title={autoRefresh ? 'Auto-refresh ON (every 2 min)' : 'Auto-refresh OFF'}
             >
               {autoRefresh ? '🔴 LIVE' : 'LIVE'}
             </button>
             <span className="text-xs text-slate-500 hidden md:inline" title={lastUpdated.toLocaleString()}>
               Updated: {lastUpdated.toLocaleTimeString()}
             </span>
             <button onClick={() => loadData()} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white" title="Refresh now">
               <RefreshIcon />
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === 'scraper' ? (
          <ScraperTrigger />
        ) : (
          <>
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
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', text: string}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showXPost, setShowXPost] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  
  const isPosted = entry.status === PostStatus.POSTED;
  const isDiscarded = entry.status === PostStatus.DISCARDED;
  
  // Calculate relative time simple
  const timeAgo = (dateString: string) => {
    const diff = (new Date().getTime() - new Date(dateString).getTime()) / 1000 / 60 / 60;
    if (diff < 1) return '< 1h ago';
    if (diff < 24) return `${Math.floor(diff)}h ago`;
    return `${Math.floor(diff / 24)}d ago`;
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isSending) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    
    setIsSending(true);
    // TODO: Connect to backend for AI inference
    // Placeholder response for now
    setTimeout(() => {
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        text: 'AI response will appear here once backend is connected.' 
      }]);
      setIsSending(false);
    }, 500);
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
            <a 
              href={entry.original_url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider hover:bg-slate-700 hover:text-white transition-colors"
            >
              {entry.source}
            </a>
            <span className="text-xs text-slate-500">{timeAgo(entry.published_date)}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
              entry.content_quality === 'high' ? 'border-green-800 text-green-400 bg-green-900/20' : 
              entry.content_quality === 'medium' ? 'border-yellow-800 text-yellow-400 bg-yellow-900/20' : 
              'border-red-800 text-red-400 bg-red-900/20'
            }`}>
              {entry.content_quality.toUpperCase()}
            </span>
          </div>
          <a 
            href={entry.original_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-blue-400 transition-colors"
            title="View Original Source"
          >
            <ExternalLinkIcon />
          </a>
        </div>

        <h3 className="text-white font-bold text-lg mb-2 leading-tight">{entry.title}</h3>
        
        <div className="relative group/summary">
          <p className="text-slate-300 text-sm leading-relaxed mb-4 transition-all duration-300">
            {showTranslation && entry.summary_translation ? (
              <span className="animate-fade-in">
                <span className="text-blue-400 font-bold text-xs uppercase mr-2">[TR]</span>
                {entry.summary_translation}
              </span>
            ) : (
              entry.summary
            )}
          </p>
        </div>

        {/* X Post Section */}
        {showXPost && entry.x_post && (
          <div className="mb-4 p-3 bg-slate-950/50 border border-slate-800 rounded-lg animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <TwitterIcon />
                <span>Generated Post</span>
              </div>
              <span className={`text-[10px] ${entry.x_post.length > 280 ? 'text-red-400' : 'text-slate-500'}`}>
                {entry.x_post.length}/280
              </span>
            </div>
            <p className="text-slate-300 text-sm whitespace-pre-wrap">{entry.x_post}</p>
          </div>
        )}

        {/* Categories/Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {entry.categories.slice(0, 3).map((cat, idx) => (
            <span key={idx} className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded-full border border-slate-700">
              #{cat}
            </span>
          ))}
          {entry.categories.length > 3 && (
            <span className="px-2 py-0.5 text-slate-500 text-[10px]">+{entry.categories.length - 3}</span>
          )}
        </div>

        {/* Chat Section */}
        {showChat && (
          <div className="mt-4 mb-4 border border-slate-800 rounded-lg bg-slate-950/50 overflow-hidden animate-fade-in">
            {/* Chat Messages */}
            <div className="max-h-48 overflow-y-auto p-3 space-y-2">
              {chatMessages.length === 0 ? (
                <div className="text-xs text-slate-600 text-center py-4">
                  Ask questions about this news item...
                </div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div key={idx} className={`text-xs ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block max-w-[80%] px-3 py-2 rounded-lg ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-800 text-slate-200'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
              {isSending && (
                <div className="text-left text-xs">
                  <div className="inline-block bg-slate-800 text-slate-400 px-3 py-2 rounded-lg">
                    Thinking...
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="border-t border-slate-800 p-2 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask something..."
                disabled={isSending}
                className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 placeholder-slate-600 disabled:opacity-50"
              />
              <button
                onClick={handleSendMessage}
                disabled={isSending || !chatInput.trim()}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-slate-800/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Translation Toggle */}
          {entry.summary_translation && (
            <button 
              onClick={() => setShowTranslation(!showTranslation)}
              className={`p-1.5 rounded-lg transition-colors ${showTranslation ? 'bg-blue-500/20 text-blue-400' : 'text-slate-500 hover:text-blue-400 hover:bg-slate-800'}`}
              title={showTranslation ? "Show Original" : "Show Translation"}
            >
              <TranslateIcon />
            </button>
          )}

          {/* X Post Toggle */}
          {entry.x_post && (
            <button 
              onClick={() => setShowXPost(!showXPost)}
              className={`p-1.5 rounded-lg transition-colors ${showXPost ? 'bg-blue-500/20 text-blue-400' : 'text-slate-500 hover:text-blue-400 hover:bg-slate-800'}`}
              title="Toggle X Post"
            >
              <TwitterIcon />
            </button>
          )}
          
          <button 
            onClick={() => setShowChat(!showChat)}
            className={`p-1.5 rounded-lg transition-colors ${showChat ? 'bg-blue-500/20 text-blue-400' : 'text-slate-500 hover:text-blue-400 hover:bg-slate-800'}`}
            title="Toggle Chat"
          >
            <MessageCircleIcon />
          </button>
        </div>

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
