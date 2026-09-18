import React from 'react';
import { Star, ShieldAlert, ChevronRight, Share, Download, ShieldCheck } from 'lucide-react';
import { NormalizedAppInspection } from '../types';

interface AppStorePreviewProps {
  inspection: NormalizedAppInspection;
  onAuditClick: () => void;
  onBack: () => void;
}

export const AppStorePreview: React.FC<AppStorePreviewProps> = ({
  inspection,
  onAuditClick,
  onBack
}) => {
  const raw = inspection.rawInfo || {};
  const iconUrl = raw.artworkUrl512 || raw.artworkUrl100 || 'https://via.placeholder.com/512?text=App';
  const name = raw.trackName || inspection.appName || 'Unknown App';
  const subtitle = raw.sellerName || 'App Developer';
  const price = raw.formattedPrice || 'GET';
  const rating = raw.averageUserRating ? parseFloat(raw.averageUserRating).toFixed(1) : '0.0';
  const ratingCount = raw.userRatingCount ? raw.userRatingCount.toLocaleString() : '0';
  const category = raw.primaryGenreName || 'Utilities';
  const ageRating = raw.contentAdvisoryRating || '4+';
  const description = raw.description || '';
  
  // Combine all screenshot URLs (iPhone + iPad)
  const allScreenshots = [
    ...(raw.screenshotUrls || []),
    ...(raw.ipadScreenshotUrls || [])
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20">
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3 flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 text-blue-600 font-medium hover:text-blue-700 transition-colors cursor-pointer"
          >
            <ChevronRight className="h-5 w-5 rotate-180" />
            <span>Search</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">
        {/* App Header */}
        <div className="flex flex-col sm:flex-row gap-6 mb-8">
          <img 
            src={iconUrl} 
            alt={name} 
            className="w-28 h-28 sm:w-32 sm:h-32 rounded-[22%] shadow-sm border border-slate-200/50 object-cover"
          />
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mb-1">{name}</h1>
            <h2 className="text-slate-500 text-lg mb-4">{subtitle}</h2>
            
            <div className="flex items-center gap-3">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full px-6 py-1.5 text-sm transition-colors">
                {price}
              </button>
              <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors cursor-pointer">
                <Share className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* The Magic Button (FixIt Audit Hook) */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 sm:p-8 mb-10 text-white shadow-xl shadow-blue-600/20 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-10">
            <ShieldCheck className="w-64 h-64" />
          </div>
          <div className="relative z-10 max-w-xl">
            <div className="flex items-center gap-2 mb-2">
              <SparklesIcon />
              <h3 className="text-xl font-bold">Fix It Core Engine</h3>
            </div>
            <p className="text-blue-100 text-sm sm:text-base">
              Dive deep into this app's metadata, permissions, and compliance risks. See exactly how Fix It evaluates real App Store listings.
            </p>
          </div>
          <button 
            onClick={onAuditClick}
            className="relative z-10 shrink-0 w-full sm:w-auto bg-white text-blue-600 hover:bg-blue-50 font-bold px-8 py-3.5 rounded-2xl shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <ShieldAlert className="h-5 w-5" />
            <span>Audit This App</span>
          </button>
        </div>

        {/* App Stats Scroll */}
        <div className="flex overflow-x-auto pb-4 mb-6 border-b border-slate-100 gap-8 snap-x no-scrollbar">
          <div className="snap-start shrink-0 text-center flex flex-col items-center min-w-[80px]">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">{ratingCount} RATINGS</span>
            <span className="text-xl font-bold text-slate-700">{rating}</span>
            <div className="flex text-slate-400 mt-1">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className={`h-3 w-3 ${i <= parseFloat(rating) ? 'fill-slate-700 text-slate-700' : ''}`} />
              ))}
            </div>
          </div>
          
          <div className="w-px bg-slate-200 shrink-0"></div>

          <div className="snap-start shrink-0 text-center flex flex-col items-center min-w-[80px]">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">AGE</span>
            <span className="text-xl font-bold text-slate-700">{ageRating}</span>
            <span className="text-[10px] text-slate-400 mt-1">Years Old</span>
          </div>

          <div className="w-px bg-slate-200 shrink-0"></div>

          <div className="snap-start shrink-0 text-center flex flex-col items-center min-w-[80px]">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">CATEGORY</span>
            <span className="text-xl font-bold text-slate-700">{category}</span>
            <span className="text-[10px] text-slate-400 mt-1">App</span>
          </div>
        </div>

        {/* Screenshots */}
        {allScreenshots.length > 0 && (
          <div className="mb-10">
            <div className="flex overflow-x-auto gap-3 pb-6 snap-x no-scrollbar">
              {allScreenshots.map((url, idx) => (
                <img 
                  key={idx}
                  src={url}
                  alt={`Screenshot ${idx + 1}`}
                  className="snap-start shrink-0 h-[400px] sm:h-[500px] w-auto rounded-[1.5rem] border border-slate-200/60 shadow-sm object-cover"
                />
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="mb-10">
          <h3 className="text-lg font-bold mb-3">Description</h3>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
            {description}
          </p>
        </div>
      </main>
    </div>
  );
};

const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-200">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/>
    <path d="M19 17v4"/>
    <path d="M3 5h4"/>
    <path d="M17 19h4"/>
  </svg>
);
