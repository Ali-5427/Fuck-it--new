import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { store } from '../services/store';
import { Application, AuditRun, AppMetadataDraft } from '../types';
import { saveMetadataCheck, hasBinaryData } from './runListingCheck';
import { FindingCard } from './FindingCard';

const LIMITS: Record<keyof AppMetadataDraft, number | null> = {
  name: 30,
  subtitle: 30,
  keywords: 100,
  promotionalText: 170,
  description: 4000,
  supportUrl: null,
  privacyPolicyUrl: null,
  category: null,
  ageRating: null
};

interface MetadataPanelProps {
  app: Application;
  audit: AuditRun | null;
  onSaved: (appId: string, auditId: string) => void;
}

function emptyDraft(app: Application, existing?: Partial<AppMetadataDraft>): AppMetadataDraft {
  return {
    name: existing?.name ?? app.name ?? '',
    subtitle: existing?.subtitle ?? '',
    description: existing?.description ?? '',
    keywords: existing?.keywords ?? '',
    promotionalText: existing?.promotionalText ?? '',
    supportUrl: existing?.supportUrl ?? '',
    privacyPolicyUrl: existing?.privacyPolicyUrl ?? '',
    category: existing?.category ?? app.primaryCategory ?? '',
    ageRating: existing?.ageRating ?? ''
  };
}

export const MetadataPanel: React.FC<MetadataPanelProps> = ({ app, audit, onSaved }) => {
  const inspection = store.getInspection(app.id);
  const [form, setForm] = useState<AppMetadataDraft>(() => emptyDraft(app, inspection?.metadata));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof AppMetadataDraft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const result = await saveMetadataCheck({ appId: app.id, form, appName: app.name, bundleId: app.bundleId });
      onSaved(result.app.id, result.audit.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the check. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const field = (
    label: string,
    key: keyof AppMetadataDraft,
    multiline = false
  ) => {
    const limit = LIMITS[key];
    const value = form[key] || '';
    const over = limit != null && value.length > limit;
    return (
      <div key={key}>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-slate-700">{label}</label>
          {limit != null && (
            <span className={`text-[10px] font-mono ${over ? 'text-red-600' : 'text-slate-400'}`}>
              {value.length}/{limit}
            </span>
          )}
        </div>
        {multiline ? (
          <textarea
            value={value}
            onChange={set(key)}
            rows={key === 'description' ? 6 : 3}
            className={`w-full rounded-lg border px-3 py-2 text-sm ${
              over ? 'border-red-300' : 'border-slate-200'
            } focus:outline-none focus:ring-2 focus:ring-blue-200`}
          />
        ) : (
          <input
            value={value}
            onChange={set(key)}
            className={`w-full rounded-lg border px-3 py-2 text-sm ${
              over ? 'border-red-300' : 'border-slate-200'
            } focus:outline-none focus:ring-2 focus:ring-blue-200`}
          />
        )}
      </div>
    );
  };

  const METADATA_CATEGORIES = ['METADATA', 'PRIVACY', 'APP_COMPLETENESS'];
  const listingFindings = (audit?.findings || []).filter(f => METADATA_CATEGORIES.includes(f.category));
  const hasOtherBinaryFindings =
    hasBinaryData(inspection) && (audit?.findings || []).some(f => !METADATA_CATEGORIES.includes(f.category));

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {field('App name', 'name')}
        {field('Subtitle', 'subtitle')}
        {field('Keywords (comma separated)', 'keywords')}
        {field('Promotional text', 'promotionalText', true)}
        {field('Description', 'description', true)}
        {field('Support URL', 'supportUrl')}
        {field('Privacy policy URL', 'privacyPolicyUrl')}
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold px-4 py-2 cursor-pointer"
      >
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Save &amp; check
      </button>

      {hasOtherBinaryFindings && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
          This app also has build findings from an IPA check — see the Build tab.
        </div>
      )}

      {listingFindings.length > 0 && (
        <div className="space-y-2 pt-2">
          {listingFindings.map(f => (
            <FindingCard key={f.id} finding={f} />
          ))}
        </div>
      )}
    </div>
  );
};
