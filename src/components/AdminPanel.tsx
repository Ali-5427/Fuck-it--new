import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  Layers, 
  Users, 
  Activity, 
  CheckCircle2, 
  Search, 
  ExternalLink, 
  Sliders,
  Sparkles,
  Code
} from 'lucide-react';
import { apiClient } from '../services/api';
import { AdminStats, AuditRule } from '../types';
import { APP_STORE_RULES, getEffectiveRules, saveStoredRuleOverride } from '../engine/rules';
import { APPLE_GUIDELINE_SOURCES } from '../engine/appleSources';

export const AdminPanel: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [rules, setRules] = useState<AuditRule[]>(() => getEffectiveRules());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    setStatsLoading(true);
    setStatsError(null);
    apiClient.getAdminStats()
      .then(data => {
        setStats(data);
        setStatsLoading(false);
      })
      .catch(err => {
        setStats(null);
        setStatsError(err.message || 'System statistics are currently unavailable.');
        setStatsLoading(false);
      });
  }, []);

  const toggleRule = (ruleId: string) => {
    setRules(prev => {
      const updated = prev.map(r => {
        if (r.id === ruleId) {
          const nextEnabled = !r.enabled;
          saveStoredRuleOverride(ruleId, nextEnabled);
          return { ...r, enabled: nextEnabled };
        }
        return r;
      });
      return updated;
    });
  };

  const filteredRules = rules.filter(r => {
    const guidelineNumber = typeof r.guidelineRef === 'string' ? r.guidelineRef : r.guidelineRef?.number || '';
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guidelineNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCat = selectedCategory === 'ALL' || r.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">Compliance Rules Registry & Stats</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Manage rule definitions, review guideline reference sources, and monitor system-wide inspection metrics.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      {statsLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex items-center justify-center gap-3 text-slate-500 text-xs">
          <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading system compliance telemetry...</span>
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="text-xs text-slate-500">Active Rule Definitions</div>
              <div className="text-2xl font-extrabold text-blue-600 mt-1">{rules.filter(r => r.enabled).length} / {rules.length}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="text-xs text-slate-500">Total Preflights Run</div>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1">{stats.totalAudits}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="text-xs text-slate-500">Apps Tracked</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats.totalApps}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="text-xs text-slate-500">Guidelines Version</div>
              <div className="text-2xl font-extrabold text-blue-600 mt-1">2026.2</div>
            </div>
          </div>

          {/* Most Common Findings */}
          {stats.mostCommonFindings && stats.mostCommonFindings.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm font-display flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" />
                <span>Most Frequent Developer Compliance Rejections</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {stats.mostCommonFindings.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-blue-600 font-bold font-mono shrink-0">{item.ruleId}</span>
                      <span className="text-slate-800 truncate">{item.title}</span>
                    </div>
                    <span className="text-amber-700 font-bold font-mono shrink-0 ml-2 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{item.count} detections</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-xs flex items-start gap-3.5">
          <div className="p-2 rounded-xl bg-slate-200/80 text-slate-600 shrink-0 mt-0.5">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">Live Telemetry & Stats Unavailable</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {statsError || 'Live server statistics require a configured production analytics data source. The rule registry and guideline references below remain active.'}
            </p>
          </div>
        </div>
      )}

      {/* Rules Registry Explorer */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900 font-display">Audit Rules Catalog ({filteredRules.length})</h2>
          
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search rule ID or guideline..."
              className="w-full rounded-xl border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none shadow-xs"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredRules.map(rule => (
            <div key={rule.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-blue-600 text-xs">{rule.id}</span>
                    <span className="text-slate-300 text-xs">•</span>
                    <span className="font-mono text-xs text-slate-600 font-semibold">
                      {typeof rule.guidelineRef === 'string' ? rule.guidelineRef : rule.guidelineRef?.number}
                    </span>
                    <span className="text-slate-300 text-xs">•</span>
                    <span className="text-xs text-slate-500">{rule.category}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                      rule.severity === 'HIGH' ? 'border-red-200 bg-red-50 text-red-700' :
                      rule.severity === 'MEDIUM' ? 'border-amber-200 bg-amber-50 text-amber-700' :
                      'border-blue-200 bg-blue-50 text-blue-700'
                    }`}>
                      {rule.severity}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mt-1">{rule.title}</h3>
                </div>

                <button
                  onClick={() => toggleRule(rule.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                    rule.enabled
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-slate-300 bg-slate-100 text-slate-500'
                  }`}
                >
                  {rule.enabled ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{rule.description}</p>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-500">
                <span className="font-mono">Detection: <strong className="text-slate-700 font-medium">{rule.detectionMethod}</strong></span>
                <a
                  href={typeof rule.guidelineRef === 'object' ? rule.guidelineRef.url : rule.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold hover:underline cursor-pointer"
                >
                  <span>{typeof rule.guidelineRef === 'object' ? rule.guidelineRef.title : 'Apple Developer Documentation'}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
