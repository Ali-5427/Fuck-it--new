import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  FileCheck, 
  Download, 
  Copy, 
  Check, 
  Printer, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink, 
  Lock, 
  Sparkles 
} from 'lucide-react';
import { SubmissionReport } from '../types';
import { useScrollLock } from '../hooks/useScrollLock';

interface SubmissionReportModalProps {
  report: SubmissionReport | null;
  onClose: () => void;
}

export const SubmissionReportModal: React.FC<SubmissionReportModalProps> = ({
  report,
  onClose
}) => {
  useScrollLock(!!report);
  const [copiedMd, setCopiedMd] = useState(false);
  const [checklist, setChecklist] = useState(report?.manualChecklist || []);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (report?.manualChecklist) {
      setChecklist(report.manualChecklist);
    }
  }, [report]);

  if (!report) return null;

  const toggleCheck = (id: string) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const generateMarkdown = () => {
    return `# Fixit App Store Submission Readiness Report
**Application:** ${report.appName} (\`${report.bundleId}\`)
**Version:** ${report.version} (Build ${report.build})
**Generated Date:** ${new Date(report.generatedAt).toLocaleString()}
**Overall Readiness Status:** ${report.readinessStatus}
**Rule Engine Version:** ${report.guidelineVersion}

---

## Executive Summary
${report.summary}

---

## Category Breakdown
${report.categorySummaries.map(c => `- **${c.category}**: ${c.status} (${c.resolvedCount} resolved, ${c.openCount} remaining)`).join('\n')}

---

## Resolved Issues (${report.resolvedIssues.length})
${report.resolvedIssues.length > 0 ? report.resolvedIssues.map(r => `- [x] **${r.title}** (${r.guidelineRef.number}) — *Fixed in Build ${r.fixedInBuild}*`).join('\n') : '_None recorded._'}

---

## Remaining Action Items & Warnings (${report.remainingWarnings.length})
${report.remainingWarnings.length > 0 ? report.remainingWarnings.map(w => `- [ ] **[${w.severity}] ${w.title}** (${w.guidelineRef.number})\n  *Action:* ${w.recommendedAction}`).join('\n') : '_No open blockers or warnings detected._'}

---

## Pre-Submission Manual Verification Checklist
${checklist.map(c => `- [${c.checked ? 'x' : ' '}] **${c.category}:** ${c.item}`).join('\n')}

---

## App Store Connect Reviewer Notes (Copy & Paste)
\`\`\`text
${report.reviewerNotesDraft}
\`\`\`

---
*Disclaimer: ${report.disclaimer}*
`;
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdown());
    setCopiedMd(true);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const md = generateMarkdown();
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.appName.replace(/[^a-zA-Z0-9]/g, '_')}_Submission_Report.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Submission Readiness Report</h3>
              <p className="text-xs text-slate-500 font-mono">
                {report.appName} • v{report.version} (Build {report.build})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-sm"
            >
              {copiedMd ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedMd ? 'Copied' : 'Copy MD'}</span>
            </button>
            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-bold text-white transition-colors cursor-pointer shadow-sm"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors ml-2 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Body */}
        <div id="printable-report" className="flex-1 min-h-0 p-6 md:p-8 overflow-y-auto space-y-6 bg-white text-slate-700 text-xs">
          
          {/* Top Banner Card */}
          <div className={`p-5 rounded-2xl border ${
            report.readinessStatus === 'NO_HIGH_RISK_ISSUES_DETECTED' 
              ? 'border-emerald-200 bg-emerald-50/60'
              : report.readinessStatus === 'READY_WITH_WARNINGS'
              ? 'border-amber-200 bg-amber-50/60'
              : 'border-red-200 bg-red-50/60'
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold font-mono border ${
                  report.readinessStatus === 'NO_HIGH_RISK_ISSUES_DETECTED' 
                    ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
                    : report.readinessStatus === 'READY_WITH_WARNINGS'
                    ? 'border-amber-300 bg-amber-100 text-amber-800'
                    : 'border-red-300 bg-red-100 text-red-800'
                }`}>
                  STATUS: {report.readinessStatus.replace(/_/g, ' ')}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-2 font-display">{report.appName} Preflight Assessment</h2>
                <p className="text-slate-500 text-xs mt-0.5 font-mono">{report.bundleId} • iOS Guidelines {report.guidelineVersion}</p>
              </div>
              <div className="text-right text-slate-500 font-mono text-[11px]">
                Report Date: {new Date(report.generatedAt).toLocaleDateString()}
              </div>
            </div>

            <p className="mt-4 text-slate-700 text-xs sm:text-sm leading-relaxed border-t border-slate-200 pt-3">
              {report.summary}
            </p>
          </div>

          {/* Category Summary Matrix */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 font-mono">
              Guideline Category Matrix
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {report.categorySummaries.map((cat, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800 text-xs">{cat.category.replace(/_/g, ' ')}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{cat.resolvedCount} fixed • {cat.openCount} remaining</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                    cat.status === 'PASS' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
                    cat.status === 'WARNING' ? 'border-amber-200 bg-amber-50 text-amber-700' :
                    'border-red-200 bg-red-50 text-red-700'
                  }`}>
                    {cat.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Resolved Items & Remaining Warnings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Resolved */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <h4 className="font-bold text-emerald-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>Resolved Preflight Items ({report.resolvedIssues.length})</span>
              </h4>
              {report.resolvedIssues.length > 0 ? (
                <div className="space-y-2 mt-2">
                  {report.resolvedIssues.map((item, idx) => (
                    <div key={idx} className="rounded-lg border border-slate-200 bg-white p-2.5 text-xs shadow-xs">
                      <div className="font-semibold text-slate-800">{item.title}</div>
                      <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                        <span className="font-mono">{item.guidelineRef.number}</span>
                        <span className="text-emerald-700 font-mono font-medium">Fixed in Build {item.fixedInBuild}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-xs py-4 text-center font-mono">No prior fixes logged.</p>
              )}
            </div>

            {/* Remaining */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <h4 className="font-bold text-amber-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                <span>Remaining Warnings ({report.remainingWarnings.length})</span>
              </h4>
              {report.remainingWarnings.length > 0 ? (
                <div className="space-y-2 mt-2">
                  {report.remainingWarnings.map((item, idx) => (
                    <div key={idx} className="rounded-lg border border-slate-200 bg-white p-2.5 text-xs shadow-xs">
                      <div className="font-semibold text-slate-800">{item.title}</div>
                      <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                        <span className="font-mono">{item.guidelineRef.number}</span>
                        <span className="text-amber-700 font-mono font-bold">{item.severity} RISK</span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-1">{item.recommendedAction}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-emerald-700 text-xs py-4 text-center font-mono">No remaining blockers detected.</p>
              )}
            </div>

          </div>

          {/* Interactive Manual Checklist */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider font-mono">
              Final Pre-Submission Manual Verification Checklist
            </h4>
            <p className="text-slate-600 text-xs">
              Ensure you have checked these App Store Connect portal settings before clicking "Submit for Review":
            </p>
            <div className="space-y-2 mt-2">
              {checklist.map(item => (
                <label
                  key={item.id}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100/70 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleCheck(item.id)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-mono text-blue-600 font-semibold mr-1.5">[{item.category}]</span>
                    <span className={item.checked ? 'text-slate-400 line-through' : 'text-slate-700'}>{item.item}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* App Store Connect Reviewer Notes Draft */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-blue-700 text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                <span>App Store Connect "App Review Information" Notes</span>
              </h4>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(report.reviewerNotesDraft);
                  alert('Reviewer notes copied to clipboard!');
                }}
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
              >
                Copy Notes
              </button>
            </div>
            <pre className="p-3 rounded-xl border border-slate-200 bg-white font-mono text-xs text-slate-800 whitespace-pre-wrap">
              {report.reviewerNotesDraft}
            </pre>
          </div>

          {/* Official Disclaimer */}
          <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500 text-center leading-relaxed">
            {report.disclaimer}
          </div>

        </div>

      </div>
    </div>
  );
};
