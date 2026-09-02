import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  PlusCircle, 
  ArrowRight, 
  GitCompare, 
  FileCheck,
  ShieldCheck
} from 'lucide-react';
import { AuditComparison } from '../types';
import { useScrollLock } from '../hooks/useScrollLock';

interface AuditDiffModalProps {
  comparison: AuditComparison | null;
  appName: string;
  onClose: () => void;
}

export const AuditDiffModal: React.FC<AuditDiffModalProps> = ({
  comparison,
  appName,
  onClose
}) => {
  useScrollLock(!!comparison);
  const [activeTab, setActiveTab] = useState<'resolved' | 'remaining' | 'new'>('resolved');

  if (!comparison) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <GitCompare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Audit Re-check Comparison</h3>
              <p className="text-xs text-slate-500 font-mono">
                {appName} • Build {comparison.previousBuild} → Build {comparison.currentBuild}
              </p>
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
        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
          
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div 
              onClick={() => setActiveTab('resolved')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                activeTab === 'resolved' 
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800' 
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Resolved</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-700 font-mono mt-1">
                +{comparison.resolvedCount}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Fixed since last build</p>
            </div>

            <div 
              onClick={() => setActiveTab('remaining')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                activeTab === 'remaining' 
                  ? 'border-amber-300 bg-amber-50 text-amber-800' 
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Remaining</span>
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              <div className="text-2xl font-extrabold text-amber-700 font-mono mt-1">
                {comparison.remainingCount}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Still open or unverified</p>
            </div>

            <div 
              onClick={() => setActiveTab('new')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                activeTab === 'new' 
                  ? 'border-red-300 bg-red-50 text-red-800' 
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">New Issues</span>
                <PlusCircle className="h-4 w-4 text-red-600" />
              </div>
              <div className="text-2xl font-extrabold text-red-700 font-mono mt-1">
                {comparison.newCount}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Introduced in this build</p>
            </div>
          </div>

          {/* Tab Filter */}
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setActiveTab('resolved')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'resolved' ? 'bg-white shadow-xs text-emerald-700 font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Resolved ({comparison.resolvedCount})
            </button>
            <button
              onClick={() => setActiveTab('remaining')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'remaining' ? 'bg-white shadow-xs text-amber-700 font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Remaining ({comparison.remainingCount})
            </button>
            <button
              onClick={() => setActiveTab('new')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'new' ? 'bg-white shadow-xs text-red-700 font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              New Findings ({comparison.newCount})
            </button>
          </div>

          {/* List of Diff Items */}
          <div className="space-y-2.5">
            {activeTab === 'resolved' && (
              comparison.resolvedFindings.length > 0 ? (
                comparison.resolvedFindings.map(f => (
                  <div key={f.id} className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 text-xs">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{f.title}</span>
                        <span className="font-mono text-[10px] text-emerald-700 font-bold">RESOLVED</span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-1">{f.guidelineRef.number} • {f.whyItMatters}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-500 font-mono">
                  No issues resolved in this build cycle.
                </div>
              )
            )}

            {activeTab === 'remaining' && (
              comparison.remainingFindings.length > 0 ? (
                comparison.remainingFindings.map(f => (
                  <div key={f.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{f.title}</span>
                        <span className="font-mono text-[10px] text-amber-700 font-bold">{f.severity} RISK</span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-1">{f.recommendedAction}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-500 font-mono">
                  All previous issues have been resolved!
                </div>
              )
            )}

            {activeTab === 'new' && (
              comparison.newFindings.length > 0 ? (
                comparison.newFindings.map(f => (
                  <div key={f.id} className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/50 p-3.5 text-xs">
                    <PlusCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{f.title}</span>
                        <span className="font-mono text-[10px] text-red-700 font-bold">{f.severity} RISK</span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-1">{f.whyItMatters}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-emerald-700 font-mono flex items-center justify-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>No new regressions or guideline violations detected!</span>
                </div>
              )
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end border-t border-slate-200 px-6 py-4 bg-slate-50">
          <button
            onClick={onClose}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
