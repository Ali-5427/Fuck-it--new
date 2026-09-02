import React, { useState } from 'react';
import { 
  Type, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle, 
  ExternalLink,
  Loader2,
  Copy,
  Check,
  Globe,
  HelpCircle
} from 'lucide-react';
import { apiClient } from '../services/api';
import { AppMetadataDraft, MetadataIssue } from '../types';

export const MetadataChecker: React.FC = () => {
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [promotionalText, setPromotionalText] = useState('');
  const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState('');
  const [supportUrl, setSupportUrl] = useState('');

  const [isValidating, setIsValidating] = useState(false);
  const [issues, setIssues] = useState<MetadataIssue[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [hasValidated, setHasValidated] = useState(false);

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      const payload: AppMetadataDraft = {
        name,
        subtitle,
        description,
        keywords,
        promotionalText,
        privacyPolicyUrl,
        supportUrl,
        category: 'Health & Fitness',
        ageRating: '4+'
      };
      const res = await apiClient.validateMetadata(payload);
      setIssues(res.issues);
      setSuggestions(res.suggestions);
      setHasValidated(true);
    } catch (e) {
      console.error('Validation error:', e);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
            <Type className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">App Store Metadata Preflight</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Audit App Store Connect metadata for character limits, Guideline 2.3 violations, and competitor mentions.
            </p>
          </div>
        </div>

      </div>

      {/* Form Fields and Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Input Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">App Store Connect Listing Draft</h3>
          
          {/* App Name */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <label className="font-semibold text-slate-700">App Name</label>
              <span className={`font-mono text-[11px] ${name.length > 30 ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                {name.length} / 30 chars
              </span>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full rounded-xl border px-3.5 py-2 text-xs text-slate-900 focus:outline-none ${
                name.length > 30 ? 'border-red-500 bg-red-50/20' : 'border-slate-300 focus:border-blue-500'
              }`}
            />
          </div>

          {/* Subtitle */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <label className="font-semibold text-slate-700">Subtitle</label>
              <span className={`font-mono text-[11px] ${subtitle.length > 30 ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                {subtitle.length} / 30 chars
              </span>
            </div>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className={`w-full rounded-xl border px-3.5 py-2 text-xs text-slate-900 focus:outline-none ${
                subtitle.length > 30 ? 'border-red-500 bg-red-50/20' : 'border-slate-300 focus:border-blue-500'
              }`}
            />
          </div>

          {/* Keywords */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <label className="font-semibold text-slate-700">Keywords (Comma separated)</label>
              <span className={`font-mono text-[11px] ${keywords.length > 100 ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                {keywords.length} / 100 chars
              </span>
            </div>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className={`w-full rounded-xl border px-3.5 py-2 text-xs text-slate-900 font-mono focus:outline-none ${
                keywords.length > 100 ? 'border-red-500 bg-red-50/20' : 'border-slate-300 focus:border-blue-500'
              }`}
            />
          </div>

          {/* Promotional Text */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <label className="font-semibold text-slate-700">Promotional Text (Optional)</label>
              <span className={`font-mono text-[11px] ${promotionalText.length > 170 ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                {promotionalText.length} / 170 chars
              </span>
            </div>
            <input
              type="text"
              value={promotionalText}
              onChange={(e) => setPromotionalText(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-700 text-xs mb-1">Full Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
            ></textarea>
          </div>

          {/* URLs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 text-xs mb-1">Privacy Policy URL</label>
              <input
                type="url"
                value={privacyPolicyUrl}
                onChange={(e) => setPrivacyPolicyUrl(e.target.value)}
                className={`w-full rounded-xl border px-3 py-2 text-xs text-slate-900 focus:outline-none ${
                  !privacyPolicyUrl.startsWith('https://') ? 'border-amber-400 bg-amber-50/30' : 'border-slate-300 focus:border-blue-500'
                }`}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 text-xs mb-1">Support URL</label>
              <input
                type="url"
                value={supportUrl}
                onChange={(e) => setSupportUrl(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleValidate}
              disabled={isValidating}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-blue-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              {isValidating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Auditing Metadata...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Audit App Store Metadata</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Validation Results & Optimization Tips */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm font-display flex items-center gap-2">
              <Search className="h-4 w-4 text-blue-600" />
              <span>Guideline 2.3 Compliance Analysis</span>
            </h3>

            {hasValidated ? (
              issues.length > 0 ? (
                <div className="space-y-3">
                  {issues.map((issue, idx) => (
                    <div key={idx} className="rounded-xl border border-red-200 bg-red-50/60 p-3.5 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-red-700 font-mono">[{issue.field.toUpperCase()}] {issue.type}</span>
                        <span className="text-[10px] text-red-700 font-mono font-bold">{issue.severity}</span>
                      </div>
                      <p className="text-slate-800">{issue.message}</p>
                      <p className="text-slate-600 text-[11px] pt-1">
                        <span className="text-emerald-700 font-semibold">Recommended Fix:</span> {issue.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span className="font-medium">Metadata passes all character budgets and contains no prohibited competitor terms!</span>
                </div>
              )
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                Click "Audit App Store Metadata" to run character budgeting, Guideline 2.3 checks, pricing claims review, and competitor name filters.
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="pt-4 border-t border-slate-200 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                  ASO & Reviewer Notes Advice
                </h4>
                <div className="space-y-2">
                  {suggestions.map((sug, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl border border-blue-100 bg-blue-50/50 text-xs text-slate-700">
                      <div className="h-2 w-2 rounded-full bg-blue-600 mt-1.5 shrink-0"></div>
                      <span>{sug}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
