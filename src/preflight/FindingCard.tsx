import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Finding } from '../types';
import { severityColorClasses, severityLabel } from './labels';

interface FindingCardProps {
  finding: Finding;
  onStatusChange?: (status: Finding['status']) => void;
}

export const FindingCard: React.FC<FindingCardProps> = ({ finding, onStatusChange }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-start gap-3 p-3 text-left cursor-pointer hover:bg-slate-50"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 mt-0.5 text-slate-400 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 mt-0.5 text-slate-400 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-mono font-bold ${severityColorClasses(
                finding.severity
              )}`}
            >
              {severityLabel(finding.severity)}
            </span>
            <span className="text-[10px] font-mono text-slate-400">{finding.ruleId}</span>
            {finding.status !== 'OPEN' && (
              <span className="text-[10px] font-mono text-slate-400">· {finding.status}</span>
            )}
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-900">{finding.title}</p>
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-slate-100 pt-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-1">
              Why it matters
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">{finding.whyItMatters}</p>
          </div>

          {finding.evidence?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-1">
                Evidence
              </p>
              <div className="space-y-1">
                {finding.evidence.map((ev, i) => (
                  <div key={i} className="text-xs font-mono bg-slate-50 rounded-md px-2 py-1.5 border border-slate-100">
                    <span className="text-slate-500">{ev.location || 'Inspection'}</span>
                    <span className="text-slate-300"> · </span>
                    <span className="text-slate-700">{ev.key}</span>
                    {ev.extractedValue !== undefined && (
                      <span className="text-slate-500">
                        {' '}
                        = {typeof ev.extractedValue === 'object' ? JSON.stringify(ev.extractedValue) : String(ev.extractedValue)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-1">
              How to fix
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">{finding.recommendedAction}</p>
          </div>

          {onStatusChange && (
            <div className="flex items-center gap-1.5 pt-1">
              {(['OPEN', 'FIXED', 'WONT_FIX'] as const).map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => onStatusChange(status)}
                  className={`rounded-md px-2 py-1 text-[10px] font-mono font-bold border cursor-pointer transition-colors ${
                    finding.status === status
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
