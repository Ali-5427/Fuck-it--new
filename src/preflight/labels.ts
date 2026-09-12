import { ReadinessStatus, AuditSeverity } from '../types';

// UI-only labels. Do NOT invent new readiness values — these map the
// existing enum (src/types/index.ts ReadinessStatus) to display copy.
export function readinessLabel(status: ReadinessStatus | undefined | null): string {
  switch (status) {
    case 'NOT_READY':
      return 'Not ready';
    case 'READY_WITH_WARNINGS':
      return 'Needs attention';
    case 'NO_HIGH_RISK_ISSUES_DETECTED':
      return 'Ready';
    default:
      return 'Not checked';
  }
}

export function readinessColorClasses(status: ReadinessStatus | undefined | null): string {
  switch (status) {
    case 'NOT_READY':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'READY_WITH_WARNINGS':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'NO_HIGH_RISK_ISSUES_DETECTED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    default:
      return 'bg-slate-100 text-slate-500 border-slate-200';
  }
}

export const READY_DISCLAIMER =
  'Fix It found no high-risk issues in the checks it ran. This is not Apple approval.';

export function severityColorClasses(severity: AuditSeverity): string {
  switch (severity) {
    case 'HIGH':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'MEDIUM':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'LOW':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    case 'MANUAL_CHECK':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

export function severityLabel(severity: AuditSeverity): string {
  switch (severity) {
    case 'HIGH':
      return 'High';
    case 'MEDIUM':
      return 'Medium';
    case 'LOW':
      return 'Low';
    case 'MANUAL_CHECK':
      return 'Manual check';
    default:
      return severity;
  }
}
