import React, { useState } from 'react';
import { Search, Loader2, Star, AlertCircle, ChevronRight, Apple } from 'lucide-react';
import { apiClient } from '../services/api';
import { store } from '../services/store';

interface SearchResult {
  trackId: number;
  trackName: string;
  artistName: string;
  primaryGenreName: string;
  artworkUrl512: string;
  averageUserRating?: number;
  userRatingCount?: number;
  bundleId: string;
  version: string;
  formattedPrice?: string;
}

export function PublicAppSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setError(null);
    setHasSearched(true);
    
    try {
      const response = await apiClient.post('/api/itunes-search', { term: searchTerm });
      if (!response.ok) {
        throw new Error(response.error || 'Failed to search App Store');
      }
      setResults(response.data.results || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while searching. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAppSelect = (app: SearchResult) => {
    // In a real router, we'd navigate to /apps/preview/:id
    // But for this MVP without React Router, we'll try to emulate the try-now preview.
    // For now, we'll set the currentView in App.tsx or use a modal.
    store.dispatch({
      type: 'START_TRY_NOW',
      payload: app.trackId.toString()
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
          Search the App Store
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Find any public iOS app to check its current status before you submit your own.
        </p>
      </div>

      <div className="bg-white shadow rounded-xl p-6 mb-8">
        <form onSubmit={handleSearch} className="relative flex items-center">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-24 py-4 text-lg border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400"
            placeholder="App name or developer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isSearching}
          />
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
            <button
              type="submit"
              disabled={isSearching || !searchTerm.trim()}
              className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Search'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {isSearching && results.length === 0 && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      )}

      {!isSearching && hasSearched && results.length === 0 && !error && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
          <Search className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-2 text-sm font-medium text-slate-900">No results found</h3>
          <p className="mt-1 text-sm text-slate-500">
            We couldn't find any apps matching "{searchTerm}". Try a different term.
          </p>
        </div>
      )}

      {!isSearching && results.length > 0 && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-slate-200">
            {results.map((app) => (
              <li key={app.trackId}>
                <button
                  onClick={() => handleAppSelect(app)}
                  className="w-full text-left block hover:bg-slate-50 focus:outline-none focus:bg-slate-50 transition duration-150 ease-in-out"
                >
                  <div className="flex items-center px-4 py-4 sm:px-6">
                    <div className="min-w-0 flex-1 flex items-center">
                      <div className="flex-shrink-0">
                        <img 
                          className="h-16 w-16 rounded-xl border border-slate-200 shadow-sm" 
                          src={app.artworkUrl512} 
                          alt={`${app.trackName} icon`} 
                          loading="lazy"
                        />
                      </div>
                      <div className="min-w-0 flex-1 px-4 md:grid md:grid-cols-2 md:gap-4">
                        <div>
                          <p className="text-lg font-medium text-slate-900 truncate">{app.trackName}</p>
                          <p className="mt-1 flex items-center text-sm text-slate-500">
                            <span className="truncate">{app.artistName}</span>
                          </p>
                        </div>
                        <div className="hidden md:block">
                          <div>
                            <p className="text-sm text-slate-900">
                              {app.primaryGenreName} • v{app.version}
                            </p>
                            <p className="mt-1 flex items-center text-sm text-slate-500">
                              {app.averageUserRating ? (
                                <span className="flex items-center">
                                  <Star className="h-4 w-4 text-amber-400 fill-current mr-1" />
                                  <span className="font-medium text-slate-700 mr-1">{app.averageUserRating.toFixed(1)}</span>
                                  ({app.userRatingCount?.toLocaleString()})
                                </span>
                              ) : (
                                <span>No ratings yet</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
