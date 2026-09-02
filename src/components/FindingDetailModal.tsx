import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ShieldAlert, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Check, 
  Clock, 
  MessageSquare, 
  Plus, 
  Code2, 
  AlertCircle,
  HelpCircle,
  FileText
} from 'lucide-react';
import { Finding, FindingStatus } from '../types';
import { store } from '../services/store';
import { useScrollLock } from '../hooks/useScrollLock';

interface FindingDetailModalProps {
  finding: Finding | null;
  appId: string;
  auditId: string;
  currentBuild: string;
  onClose: () => void;
}

export const FindingDetailModal: React.FC<FindingDetailModalProps> = ({
  finding,
  appId,
  auditId,
  currentBuild,
  onClose
}) => {
  useScrollLock(!!finding);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [targetBuild, setTargetBuild] = useState(currentBuild);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    setTargetBuild(currentBuild);
  }, [currentBuild, finding]);

  if (!finding) return null;

  const handleCopyCode = () => {
    if (finding.codeSnippet) {
      navigator.clipboard.writeText(finding.codeSnippet);
      setCopiedSnippet(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopiedSnippet(false), 2000);
    }
  };

  const handleStatusChange = (newStatus: FindingStatus) => {
    store.updateFindingStatus(appId, auditId, finding.id, newStatus, undefined, targetBuild);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    store.updateFindingStatus(
      appId, 
      auditId, 
      finding.id, 
      finding.status, 
      newNoteText.trim(), 
      targetBuild
    );
    setNewNoteText('');
  };

  const handleQuickMarkFixed = () => {
    store.updateFindingStatus(
      appId,
      auditId,
      finding.id,
      'FIXED',
      `Marked fixed for build ${targetBuild}`,
      targetBuild
    );
    onClose();
  };

  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'HIGH':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'LOW':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border ${getSeverityStyle(finding.severity)}`}>
              {finding.severity} RISK
            </span>
            <div>
              <span className="text-xs font-mono text-blue-600 font-semibold">{finding.ruleId}</span>
              <span className="text-slate-400 text-xs mx-1.5">•</span>
              <span className="text-xs text-slate-500">{finding.category.replace(/_/g, ' ')}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 min-h-0 p-6 overflow-y-auto space-y-6">
          
          {/* Finding Title & Guideline Reference */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 leading-snug">{finding.title}</h2>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="text-slate-500">Apple Guideline:</span>
              <a
                href={finding.guidelineRef.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-mono font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                <span>{finding.guidelineRef.number} ({finding.guidelineRef.title})</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Status Switcher Bar */}
          {!appId.startsWith('try_now_') && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-600">Finding Status:</span>
                <select
                  value={finding.status}
                  onChange={(e) => handleStatusChange(e.target.value as FindingStatus)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold focus:outline-none cursor-pointer ${
                    finding.status === 'FIXED'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : finding.status === 'IN_PROGRESS'
                      ? 'border-blue-200 bg-blue-50 text-blue-700'
                      : finding.status === 'MANUAL_REVIEW'
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                      : 'border-red-200 bg-red-50 text-red-700'
                  }`}
                >
                  <option value="OPEN">🔴 OPEN (Not Fixed)</option>
                  <option value="IN_PROGRESS">🟡 IN PROGRESS</option>
                  <option value="FIXED">🟢 FIXED / RESOLVED</option>
                  <option value="MANUAL_REVIEW">🟣 MANUAL REVIEW</option>
                  <option value="WONT_FIX">⚪ WON'T FIX (Acknowledged)</option>
                </select>
              </div>

              {finding.status !== 'FIXED' ? (
                <button
                  onClick={handleQuickMarkFixed}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Mark as Fixed in Build {targetBuild}</span>
                </button>
              ) : (
                <span className="text-xs text-emerald-700 font-mono font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Resolved in Build {finding.fixedInBuild || targetBuild}</span>
                </span>
              )}
            </div>
          )}

          {/* Why It Matters */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
              <span>Why This Was Flagged</span>
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed">
              {finding.whyItMatters}
            </p>
          </div>

          {/* Evidence Detected */}
          {finding.evidence && finding.evidence.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 font-mono">
                Evidence Found In Artifacts
              </h4>
              <div className="space-y-2">
                {finding.evidence.map((ev, idx) => (
                  <div key={`${ev.key}-${ev.location || 'info'}-${ev.detectionStatus || idx}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-blue-600">{ev.key}</span>
                      <span className="text-slate-500 font-mono text-[10px]">{ev.location}</span>
                    </div>
                    {ev.extractedValue && (
                      <div className="font-mono text-slate-800 bg-white px-2 py-1 rounded border border-slate-200 text-[11px] truncate">
                        {typeof ev.extractedValue === 'object' ? JSON.stringify(ev.extractedValue) : String(ev.extractedValue)}
                      </div>
                    )}
                    {ev.notes && (
                      <p className="text-slate-600 text-[11px]">{ev.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* What to verify */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-1.5 flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5" />
              <span>What To Verify In Your Code</span>
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed">
              {finding.whatToVerify}
            </p>
          </div>

          {/* Recommended Remediation Action */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Recommended Remediation
            </h4>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 leading-relaxed space-y-2">
              <p>{finding.recommendedAction}</p>
            </div>
          </div>

          {/* Code Snippet */}
          {finding.codeSnippet && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
                  <Code2 className="h-3.5 w-3.5 text-blue-600" />
                  <span>Code / Config Patch</span>
                </h4>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                >
                  {copiedSnippet ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span className="text-emerald-600">Copied to Clipboard</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy Snippet</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="rounded-xl border border-slate-200 bg-slate-900 p-3.5 font-mono text-xs text-blue-300 overflow-x-auto">
                <code>{finding.codeSnippet}</code>
              </pre>
            </div>
          )}

          {/* Developer Notes & Fix Timeline */}
          {!appId.startsWith('try_now_') && (
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
                <span>Remediation Notes & Audit History</span>
              </h4>

              {/* Add note form */}
              <form onSubmit={handleAddNote} className="space-y-2">
                <textarea
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Log a fix note, Xcode commit hash, or explanation (e.g. Added PrivacyInfo.xcprivacy with CA92.1 in build 43)..."
                  rows={2}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                ></textarea>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">Target Build:</span>
                    <input
                      type="text"
                      value={targetBuild}
                      onChange={(e) => setTargetBuild(e.target.value)}
                      className="w-16 rounded border border-slate-300 bg-white px-2 py-0.5 text-xs text-slate-900 font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!newNoteText.trim()}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-3 py-1 text-xs font-semibold text-white transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Note</span>
                  </button>
                </div>
              </form>

              {/* Timeline */}
              {finding.notes && finding.notes.length > 0 && (
                <div className="space-y-2 mt-3">
                  {finding.notes.map(note => (
                    <div key={note.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span className="font-medium text-slate-700">{note.author}</span>
                        <span className="font-mono">{new Date(note.createdAt).toLocaleDateString()} {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-slate-800">{note.text}</p>
                      {note.buildNumber && (
                        <span className="inline-block font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          Build {note.buildNumber}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 bg-slate-50">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Close
          </button>

          <a
            href={finding.guidelineRef.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
          >
            <span>Read Official Apple Guideline Docs</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

      </div>
    </div>
  );
};
