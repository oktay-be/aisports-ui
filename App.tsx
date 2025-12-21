import React, { useState, useEffect, useMemo } from 'react';
import { NewsEntry, PostStatus, FilterState, GeminiAnalysis, SourceRegion } from './types';
import { fetchNews } from './services/dataService';
import { ScraperTrigger } from './components/ScraperTrigger';
import { loadPreferences, savePreferences, UserPreferences, DEFAULT_PREFERENCES } from './services/userPreferencesService';

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
const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);
const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
);

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [entries, setEntries] = useState<NewsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<SourceRegion>('tr');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'feed' | 'scraper' | 'fetcher'>('feed');
  const [fetcherLoading, setFetcherLoading] = useState(false);
  const [showTagSettings, setShowTagSettings] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [sourceTypeFilter, setSourceTypeFilter] = useState<{ scraped: boolean; api: boolean }>({ scraped: true, api: true });
  
  // Multi-user state
  const [isAdmin, setIsAdmin] = useState(false);
  const [feedFilter, setFeedFilter] = useState<'my' | 'all' | string>('my');
  const [allowedUsers, setAllowedUsers] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Prefetch state (server-side caching handles the actual cache)
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [prefetchComplete, setPrefetchComplete] = useState(false);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    startDate: getTodayDate(),
    endDate: getTodayDate(),
    status: 'ALL'
  });

  const setToday = () => {
    const today = getTodayDate();
    setFilters(prev => ({ ...prev, startDate: today, endDate: today }));
  };

  // Compute all unique tags from entries
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    entries.forEach(entry => {
      entry.categories?.forEach(cat => {
        const tag = typeof cat === 'string' ? cat : cat.tag;
        if (tag) tags.add(tag);
      });
    });
    return Array.from(tags).sort();
  }, [entries]);

  // Update selectedTags when entries change (select all by default)
  useEffect(() => {
    if (allTags.length > 0) {
      setSelectedTags(new Set(allTags));
    }
  }, [allTags.join(',')]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tag)) {
        newSet.delete(tag);
      } else {
        newSet.add(tag);
      }
      return newSet;
    });
  };

  const selectAllTags = () => setSelectedTags(new Set(allTags));
  const clearAllTags = () => setSelectedTags(new Set());

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showUserMenu && !(e.target as Element).closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu]);

  // Google Sign-In Initialization
  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (window.google && !user) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: async (response: any) => {
            const credential = response.credential;
            const payload = JSON.parse(atob(credential.split('.')[1]));

            // SECURITY: Verify with backend before allowing access
            try {
              const userResponse = await fetch('/api/user', {
                headers: { 'Authorization': `Bearer ${credential}` }
              });

              if (!userResponse.ok) {
                // User not allowed - show error
                alert(`Access Denied: Your email (${payload.email}) is not in the allowed users list. Please contact the administrator.`);
                setToken(null);
                setUser(null);
                return;
              }

              // User is allowed - proceed with login
              setToken(credential);
              setUser(payload);
            } catch (error) {
              console.error('Authentication error:', error);
              alert('Authentication failed. Please try again.');
              setToken(null);
              setUser(null);
            }
          }
        });

        const buttonDiv = document.getElementById("google-signin-button");
        if (buttonDiv) {
          window.google.accounts.id.renderButton(
            buttonDiv,
            { theme: "outline", size: "large" }
          );
        }
      }
    };

    // Check if script is already loaded
    if (window.google) {
      initializeGoogleSignIn();
    } else {
      // Wait for script to load
      const interval = setInterval(() => {
        if (window.google) {
          initializeGoogleSignIn();
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Load user info (admin status, allowed users) and preferences when authenticated
  useEffect(() => {
    if (!token) return;

    const loadUserInfo = async () => {
      try {
        // Load user info including admin status
        const userResponse = await fetch('/api/user', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setIsAdmin(userData.isAdmin);
        }

        // If admin, load allowed users list for feed filter
        const adminResponse = await fetch('/api/config/admin-users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (adminResponse.ok) {
          const adminData = await adminResponse.json();
          // Load allowed users list
          const allowedResponse = await fetch('/api/config/allowed-users', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (allowedResponse.ok) {
            const allowedData = await allowedResponse.json();
            setAllowedUsers(allowedData.users || []);
          }
        }

        // Load user preferences
        const prefs = await loadPreferences(token);
        setPreferences(prefs);
        if (prefs.feedFilter) {
          setFeedFilter(prefs.feedFilter);
        }
      } catch (error) {
        console.error('Error loading user info:', error);
      }
    };

    loadUserInfo();
  }, [token]);

  // Background prefetch historical data after login
  useEffect(() => {
    if (!token || !user || prefetchComplete) return;

    const prefetchHistoricalData = async () => {
      setIsPrefetching(true);
      const historicalDepth = parseInt(import.meta.env.VITE_HISTORICAL_DEPTH || '3');

      console.log(`📦 Prefetching last ${historicalDepth} days of data in background (server will cache)...`);

      try {
        // Trigger prefetch - server will cache the results
        await fetchNews(selectedRegion, undefined, undefined, token, historicalDepth);
        console.log(`✅ Prefetch complete - server has cached last ${historicalDepth} days`);
        setPrefetchComplete(true);
      } catch (error) {
        console.error('❌ Prefetch failed:', error);
      } finally {
        setIsPrefetching(false);
      }
    };

    // Start prefetch in background (don't block UI)
    setTimeout(prefetchHistoricalData, 100);
  }, [token, user, selectedRegion, prefetchComplete]);

  // Initial Fetch & Date Filter Watch - fetch whenever dates or region change
  useEffect(() => {
    if (!token) return; // Only fetch if authenticated
    loadData();
  }, [selectedRegion, filters.startDate, filters.endDate, token]);

  // Auto-refresh every 2 minutes when enabled
  useEffect(() => {
    if (!autoRefresh || !token) return;

    const interval = setInterval(() => {
      console.log('Auto-refreshing data...');
      loadData();
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(interval);
  }, [autoRefresh, selectedRegion, filters.startDate, filters.endDate, token]);

  // Reload data when feedFilter changes
  useEffect(() => {
    if (!token) return;
    loadData();
  }, [feedFilter]);

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      console.log(`📡 Fetching data for ${filters.startDate} to ${filters.endDate}...`);

      // Server-side caching handles everything now!
      const data = await fetchNews(
        selectedRegion,
        filters.startDate,
        filters.endDate,
        token
      );

      setEntries(data);
      setLastUpdated(new Date());
      console.log(`✅ Loaded ${data.length} articles`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Handle feed filter change and save to preferences
  const handleFeedFilterChange = async (newFilter: 'my' | 'all' | string) => {
    setFeedFilter(newFilter);
    if (token) {
      await savePreferences(token, { ...preferences, feedFilter: newFilter });
    }
  };

  // Filtering Logic
  const filteredEntries = useMemo(() => {
    console.log('[App] Filtering entries. Total:', entries.length);
    console.log('[App] Current filters:', filters);
    console.log('[App] Selected tags:', Array.from(selectedTags));
    console.log('[App] Source type filter:', sourceTypeFilter);

    return entries.filter((entry, index) => {
      const matchesSearch = entry.summary.toLowerCase().includes(filters.search.toLowerCase()) || 
                            entry.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                            entry.source.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesStatus = filters.status === 'ALL' ? true : entry.status === filters.status;

      // Tag filtering: entry must have at least one category that is selected
      // OR have no categories (uncategorized articles should always show)
      const matchesTags = selectedTags.size === 0 ||
                          !entry.categories ||
                          entry.categories.length === 0 ||
                          entry.categories.some(cat => selectedTags.has(typeof cat === 'string' ? cat : cat.tag));

      // Source type filtering (only 'api' or 'scraped' are valid values)
      const entrySourceType = entry.source_type || 'scraped'; // Default to scraped for backward compatibility
      const matchesSourceType = (entrySourceType === 'scraped' && sourceTypeFilter.scraped) ||
                                 (entrySourceType === 'api' && sourceTypeFilter.api);
      
      if (index < 3) {
         console.log(`[App] Entry ${index} check:`, {
            id: entry.id,
            matchesSearch,
            matchesStatus,
            matchesTags,
            matchesSourceType,
            categories: entry.categories,
            sourceType: entrySourceType
         });
      }

      // Note: Date filtering is handled by the API (based on scraping date),
      // not here (which would filter by article published_date).
      // Articles scraped on 2025-12-05 might have been published days earlier.

      return matchesSearch && matchesStatus && matchesTags && matchesSourceType;
    });
  }, [entries, filters, selectedTags, sourceTypeFilter]);

  // Actions
  const handlePost = (id: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, status: PostStatus.POSTED } : e));
  };

  const handleDiscard = (id: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, status: PostStatus.DISCARDED } : e));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="bg-slate-900 p-8 rounded-lg shadow-xl border border-slate-800 text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
            NP
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">NewsPulse</h1>
          <p className="text-slate-400 mb-6">Please sign in to access the curator dashboard.</p>
          <div id="google-signin-button" className="flex justify-center"></div>
        </div>
      </div>
    );
  }

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
              <button
                onClick={async () => {
                  setFetcherLoading(true);
                  try {
                    // Fetch config from GCS
                    const configRes = await fetch('/api/config/news-api', {
                      headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (!configRes.ok) throw new Error('Failed to load config');
                    const config = await configRes.json();

                    // Trigger with config values
                    const res = await fetch('/api/trigger-news-api', {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        keywords: config.default_keywords,
                        time_range: config.default_time_range,
                        max_results: config.default_max_results
                      })
                    });
                    if (!res.ok) throw new Error('Failed to trigger fetcher');
                    alert('Fetcher triggered successfully!');
                  } catch (e) {
                    alert('Failed to trigger fetcher.');
                  } finally {
                    setFetcherLoading(false);
                  }
                }}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                  fetcherLoading ? 'bg-blue-900 text-blue-300' : 'text-slate-400 hover:text-white'
                }`}
                disabled={fetcherLoading}
              >
                Fetcher
                {fetcherLoading && <span className="ml-1 animate-spin">⏳</span>}
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
             
             {/* Feed Filter Dropdown (Admin only sees all options) */}
             <div className="relative user-menu-container">
               <button 
                 onClick={() => setShowUserMenu(!showUserMenu)}
                 className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
               >
                 {user?.picture ? (
                   <img src={user.picture} alt="" className="w-6 h-6 rounded-full" />
                 ) : (
                   <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                     {user?.name?.charAt(0) || '?'}
                   </div>
                 )}
                 <span className="text-sm text-slate-300 hidden md:inline max-w-[120px] truncate">
                   {user?.name || user?.email}
                 </span>
                 <ChevronDownIcon />
               </button>
               
               {showUserMenu && (
                 <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
                   <div className="p-3 border-b border-slate-700">
                     <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                     <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                     {isAdmin && (
                       <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold bg-amber-600/20 text-amber-400 rounded">
                         ADMIN
                       </span>
                     )}
                   </div>
                   
                   <div className="p-2 border-b border-slate-700">
                     <p className="px-2 py-1 text-xs font-medium text-slate-500 uppercase">Feed Filter</p>
                     <button
                       onClick={() => { handleFeedFilterChange('my'); setShowUserMenu(false); }}
                       className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                         feedFilter === 'my' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'
                       }`}
                     >
                       My Feeds
                     </button>
                     {isAdmin && (
                       <>
                         <button
                           onClick={() => { handleFeedFilterChange('all'); setShowUserMenu(false); }}
                           className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                             feedFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'
                           }`}
                         >
                           All Feeds
                         </button>
                         {allowedUsers.filter(email => email !== user?.email).length > 0 && (
                           <div className="mt-1 pt-1 border-t border-slate-700">
                             <p className="px-3 py-1 text-xs text-slate-500">Other Users</p>
                             {allowedUsers.filter(email => email !== user?.email).map(email => (
                               <button
                                 key={email}
                                 onClick={() => { handleFeedFilterChange(email); setShowUserMenu(false); }}
                                 className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors truncate ${
                                   feedFilter === email ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'
                                 }`}
                               >
                                 {email}
                               </button>
                             ))}
                           </div>
                         )}
                       </>
                     )}
                   </div>
                   
                   <div className="p-2">
                     <button 
                       onClick={() => { setUser(null); setToken(null); setShowUserMenu(false); }}
                       className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-slate-700 rounded-md transition-colors"
                     >
                       Sign Out
                     </button>
                   </div>
                 </div>
               )}
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === 'scraper' ? (
          <ScraperTrigger token={token || undefined} />
        ) : (
          <>
        {/* Prefetch & Cache Indicator */}
        {isPrefetching && (
          <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg flex items-center gap-3">
            <svg className="animate-spin h-4 w-4 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-blue-300">
              Loading last {import.meta.env.VITE_HISTORICAL_DEPTH || '3'} days of data in background...
            </span>
          </div>
        )}
        {prefetchComplete && (
          <div className="mb-4 p-2 bg-green-900/10 border border-green-700/20 rounded-lg">
            <span className="text-xs text-green-400">
              💾 Server cache ready (fast loading enabled)
            </span>
          </div>
        )}

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
              <button
                onClick={setToday}
                className="px-3 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700"
              >
                Today
              </button>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        {loading ? (
           <div className="flex items-center justify-center h-64 text-slate-500">Loading entries from bucket...</div>
        ) : (
          <>
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-white">
                    Feed <span className="ml-2 px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded-full">{filteredEntries.length}</span>
                  </h2>
                  {/* Source Type Filter */}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sourceTypeFilter.scraped}
                        onChange={(e) => setSourceTypeFilter(prev => ({ ...prev, scraped: e.target.checked }))}
                        className="w-3 h-3 rounded border-slate-600 bg-slate-700 text-orange-500 focus:ring-orange-500 focus:ring-offset-slate-800"
                      />
                      <span className="text-xs font-medium text-orange-400">Scraped</span>
                    </label>
                    <div className="w-px h-4 bg-slate-600"></div>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sourceTypeFilter.api}
                        onChange={(e) => setSourceTypeFilter(prev => ({ ...prev, api: e.target.checked }))}
                        className="w-3 h-3 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800"
                      />
                      <span className="text-xs font-medium text-blue-400">API</span>
                    </label>
                  </div>
                  <button
                    onClick={() => setShowTagSettings(!showTagSettings)}
                    className={`p-2 rounded-lg transition-colors border ${
                      showTagSettings 
                        ? 'bg-blue-600 text-white border-blue-500' 
                        : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700 hover:border-slate-600'
                    }`}
                    title="Filter by tags"
                  >
                    <SettingsIcon />
                  </button>
                </div>
             </div>

             {/* Tag Filter Panel */}
             {showTagSettings && (
               <div className="mb-6 p-4 bg-slate-900 rounded-xl border border-slate-800 animate-fade-in">
                 <div className="flex items-center justify-between mb-3">
                   <h3 className="text-sm font-semibold text-slate-300">Filter by Tags</h3>
                   <div className="flex gap-2">
                     <button
                       onClick={selectAllTags}
                       className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded transition-colors"
                     >
                       Select All
                     </button>
                     <button
                       onClick={clearAllTags}
                       className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded transition-colors"
                     >
                       Clear All
                     </button>
                   </div>
                 </div>
                 <div className="flex flex-wrap gap-2">
                   {allTags.map(tag => (
                     <div
                       key={tag}
                       onClick={() => toggleTag(tag)}
                       className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors border ${
                         selectedTags.has(tag)
                           ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                           : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
                       }`}
                     >
                       <span className="text-xs font-medium">{tag.replace(/_/g, ' ')}</span>
                     </div>
                   ))}
                 </div>
               </div>
             )}

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
            {/* Source Type Badge - sphere with text on hover */}
            <span className={`group relative flex items-center gap-1 cursor-default`}>
              <span className={`w-2.5 h-2.5 rounded-full ${
                entry.source_type === 'api' 
                  ? 'bg-blue-500' 
                  : 'bg-orange-500'
              }`}></span>
              <span className={`text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                entry.source_type === 'api' 
                  ? 'text-blue-400' 
                  : 'text-orange-400'
              }`}>
                {entry.source_type === 'api' ? 'API' : 'SCRAPED'}
              </span>
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
              entry.content_quality === 'high' ? 'border-green-800 text-green-400 bg-green-900/20' :
              entry.content_quality === 'medium' ? 'border-yellow-800 text-yellow-400 bg-yellow-900/20' :
              'border-red-800 text-red-400 bg-red-900/20'
            }`}>
              {entry.content_quality?.toUpperCase() || 'N/A'}
            </span>
            {/* Language Badge */}
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-slate-700 text-slate-400 bg-slate-800/50">
              {entry.language?.toUpperCase() || 'TR'}
            </span>
            {entry.article_id && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(entry.article_id!);
                }}
                className="text-[10px] px-1.5 py-0.5 rounded border border-slate-700 text-slate-400 bg-slate-800/50 hover:bg-slate-700 hover:text-slate-300 transition-colors cursor-pointer"
                title={`Copy ID: ${entry.article_id}`}
              >
                ID
              </button>
            )}
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
          {entry.categories.slice(0, 3).map((cat, idx) => {
            const tag = typeof cat === 'string' ? cat : cat.tag;
            return (
              <span key={idx} className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded-full border border-slate-700">
                #{tag}
              </span>
            );
          })}
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
