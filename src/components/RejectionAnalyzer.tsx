import React, { useState, useRef, useEffect } from 'react';
import { 
  AlertTriangle, 
  Sparkles, 
  Send, 
  Copy, 
  Check, 
  CheckCircle2, 
  ExternalLink, 
  HelpCircle, 
  FileText,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { apiClient } from '../services/api';
import { RejectionAnalysisResult } from '../types';

export const RejectionAnalyzer: React.FC = () => {
  const [rejectionText, setRejectionText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<RejectionAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedDraft, setCopiedDraft] = useState(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleAnalyze = async (textToAnalyze?: string) => {
    const text = textToAnalyze || rejectionText;
    if (!text.trim()) {
      setErrorMsg('Please paste the Apple App Review rejection notice.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);

    try {
      const data = await apiClient.analyzeRejection(text);
      setResult(data);
    } catch (err: any) {
      console.error('Rejection analysis error:', err);
      setErrorMsg(err.message || 'Failed to analyze rejection message');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyDraft = () => {
    if (result?.developerResponseDraft) {
      navigator.clipboard.writeText(result.developerResponseDraft);
      setCopiedDraft(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopiedDraft(false), 2000);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">App Store Rejection Recovery</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Paste feedback from App Store Connect Resolution Center. Get plain-English guidance and a professional reply draft.
            </p>
          </div>
        </div>
      </div>

      {/* Input Section Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
            Apple Resolution Center Rejection Notice
          </label>
          <span className="text-xs text-slate-500">Paste exact message from Apple reviewer</span>
        </div>

        <textarea
          value={rejectionText}
          onChange={(e) => setRejectionText(e.target.value)}
          placeholder="Paste Apple's message here (e.g. 'Guideline 5.1.1 - Legal - Privacy... We found that your app...')"
          rows={6}
          className="w-full rounded-xl border border-slate-300 bg-slate-50 p-4 text-xs font-mono text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
        ></textarea>

        {errorMsg && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => handleAnalyze()}
            disabled={isAnalyzing || !rejectionText.trim()}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-2.5 text-xs font-bold text-white shadow-sm shadow-blue-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Analyzing Guideline Context...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Diagnose Rejection & Draft Response</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Result */}
      {result && (
        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm animate-in fade-in duration-200">
          
          {/* Top Status & Guideline */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border ${
                  result.recommendedAction === 'FIX' ? 'border-red-200 bg-red-50 text-red-700' :
                  result.recommendedAction === 'APPEAL' ? 'border-purple-200 bg-purple-50 text-purple-700' :
                  result.recommendedAction === 'CLARIFY' ? 'border-blue-200 bg-blue-50 text-blue-700' :
                  'border-amber-200 bg-amber-50 text-amber-700'
                }`}>
                  RECOMMENDED ACTION: {result.recommendedAction}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  Confidence: {Math.round(result.confidenceScore * 100)}%
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-2 font-display">
                {result.guidelinesIdentified[0]?.guidelineNumber} — {result.guidelinesIdentified[0]?.title}
              </h3>
            </div>

            {result.guidelinesIdentified[0]?.url && (
              <a
                href={result.guidelinesIdentified[0].url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold hover:underline cursor-pointer"
              >
                <span>Read Official Apple Guideline Docs</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          {/* Plain English Translation */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              Plain-English Breakdown
            </h4>
            <p className="text-sm text-slate-800 leading-relaxed font-medium">
              {result.plainEnglishExplanation}
            </p>
            <p className="text-xs text-slate-600 pt-2 border-t border-slate-200">
              <span className="font-semibold text-slate-800">Action Rationale:</span> {result.actionJustification}
            </p>
          </div>

          {/* Remediation Steps */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-3">
              Step-by-Step Fix Instructions
            </h4>
            <div className="space-y-2">
              {result.remediationSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-xs shadow-xs">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 font-bold font-mono text-[10px] border border-blue-200">
                    {idx + 1}
                  </div>
                  <span className="text-slate-700 mt-0.5 leading-relaxed">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* App Review Notes Advice */}
          {result.appleReviewNotesAdvice && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 font-mono mb-1">
                App Review Notes Advice
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed">
                {result.appleReviewNotesAdvice}
              </p>
            </div>
          )}

          {/* Developer Reply Draft */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-blue-600" />
                <span>Ready-To-Send Resolution Center Response</span>
              </h4>
              <button
                onClick={handleCopyDraft}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                {copiedDraft ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied to Clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Draft</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 rounded-xl border border-slate-200 bg-slate-900 font-mono text-xs text-blue-100 whitespace-pre-wrap leading-relaxed">
              {result.developerResponseDraft}
            </pre>
          </div>

        </div>
      )}

    </div>
  );
};
