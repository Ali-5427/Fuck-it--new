import React, { useState, useRef, useEffect } from 'react';
import { useScrollLock } from '../hooks/useScrollLock';
import { 
  CheckSquare, 
  ShieldCheck, 
  Copy, 
  Check, 
  X, 
  Info,
  AlertCircle
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  category: 'AUTH' | 'PRIVACY' | 'IAP' | 'UGC' | 'METADATA' | 'COMPLETENESS';
  title: string;
  guideline: string;
  description: string;
  recommendation: string;
  critical: boolean;
}

const CHECKLIST_DATA: ChecklistItem[] = [
  {
    id: 'chk-1',
    category: 'PRIVACY',
    title: 'PrivacyInfo.xcprivacy Included for Required Reason APIs',
    guideline: 'Guideline 5.1.2',
    description: 'If you or any bundled SDK use File Timestamps, Disk Space, System Boot Time, or User Defaults, they must be declared with valid Apple reason codes.',
    recommendation: 'Ensure PrivacyInfo.xcprivacy is bundled in the app target and third-party frameworks.',
    critical: true
  },
  {
    id: 'chk-2',
    category: 'AUTH',
    title: 'Sign in with Apple Paired with Social Logins',
    guideline: 'Guideline 4.8',
    description: 'If you offer Google, Facebook, Twitter, or other social login providers, Sign in with Apple must be offered as an equivalent option.',
    recommendation: 'Place Sign in with Apple alongside or above third-party sign-in buttons with identical prominence.',
    critical: true
  },
  {
    id: 'chk-3',
    category: 'AUTH',
    title: 'In-App Account Deletion with Immediate Data Purge',
    guideline: 'Guideline 5.1.1(v)',
    description: 'Apps allowing account creation must allow users to initiate permanent account deletion directly within the app settings.',
    recommendation: 'Add a clear "Delete Account" button in account settings that does not just redirect to a general email or website.',
    critical: true
  },
  {
    id: 'chk-4',
    category: 'PRIVACY',
    title: 'Explicit Purpose Strings in Info.plist (No Generic Text)',
    guideline: 'Guideline 5.1.1',
    description: 'All NSCameraUsageDescription, NSPhotoLibraryUsageDescription, etc. must explain specifically WHY your app needs access and HOW it is used.',
    recommendation: 'Reject strings like "App needs camera access". Use "Scan food barcodes to log meals in your daily diary".',
    critical: true
  },
  {
    id: 'chk-5',
    category: 'PRIVACY',
    title: 'App Transport Security (ATS) Arbitrary Loads Disabled',
    guideline: 'Guideline 5.1.1 / Security',
    description: 'NSAllowsArbitraryLoads must not be set to YES without documented technical justification to App Review.',
    recommendation: 'Serve all network endpoints over modern HTTPS / TLS 1.3 or use domain-specific exceptions.',
    critical: true
  },
  {
    id: 'chk-6',
    category: 'IAP',
    title: 'Working "Restore Purchases" Button on Paywall',
    guideline: 'Guideline 3.1.2',
    description: 'All apps offering auto-renewable subscriptions or non-consumable IAP must provide a functioning Restore Purchases control.',
    recommendation: 'Ensure the Restore button is easily visible on paywalls and in the app settings screen.',
    critical: true
  },
  {
    id: 'chk-7',
    category: 'IAP',
    title: 'Terms of Use (EULA) and Privacy Policy Links on Paywall',
    guideline: 'Guideline 3.1.2 / 5.1.1',
    description: 'Subscription purchase screens must clearly link to active, working Terms of Use (Apple Standard EULA or custom) and Privacy Policy.',
    recommendation: 'Include direct tappable links in the paywall footer before the purchase confirmation CTA.',
    critical: true
  },
  {
    id: 'chk-8',
    category: 'UGC',
    title: 'User-Generated Content (UGC) Moderation & Block Mechanism',
    guideline: 'Guideline 1.2',
    description: 'Apps with public user posts, chats, or forums must provide post reporting, user blocking, and swift moderation action within 24h.',
    recommendation: 'Implement a 3-dot menu with "Report Content" and "Block User" options on all user-submitted items.',
    critical: true
  },
  {
    id: 'chk-9',
    category: 'COMPLETENESS',
    title: 'Demo / Reviewer Credentials Provided in App Store Connect',
    guideline: 'Guideline 2.1',
    description: 'If any part of the app requires logging in or subscription access, provide working test login credentials in the App Review Notes.',
    recommendation: 'Set up a dedicated test account with pre-seeded data for the App Reviewer team.',
    critical: true
  },
  {
    id: 'chk-10',
    category: 'METADATA',
    title: 'App Store Metadata Free of Competitor Trademarks & Placeholder Text',
    guideline: 'Guideline 2.3',
    description: 'App title (<= 30 chars), subtitle (<= 30 chars), and description must not mention Android, Google Play, or contain "Test / Beta / WIP".',
    recommendation: 'Scan all copy for banned terms and verify support URLs resolve to active HTTPS webpages.',
    critical: false
  },
  {
    id: 'chk-11',
    category: 'METADATA',
    title: 'Accurate Device Resolution Screenshots (No Alpha / Broken Borders)',
    guideline: 'Guideline 2.3.3',
    description: 'Screenshots must match Apple resolution specs (e.g. 1290x2796 for 6.7" iPhone) without alpha transparency channels.',
    recommendation: 'Ensure PNG/JPEG files are 24-bit RGB without an alpha channel to prevent App Store Connect upload rejection.',
    critical: false
  },
  {
    id: 'chk-12',
    category: 'COMPLETENESS',
    title: 'IPv6 Network Compatibility & Zero Crashes on First Launch',
    guideline: 'Guideline 2.1',
    description: 'App must function properly in standard IPv6-only network environments used by Apple review test devices.',
    recommendation: 'Test on iOS IPv6 NAT64 Wi-Fi hotspot before uploading binary.',
    critical: true
  }
];

interface ReviewChecklistProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const ReviewChecklist: React.FC<ReviewChecklistProps> = ({ isOpen, onClose }) => {
  useScrollLock(isOpen);
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  // If this is a modal and it is not open, do not render
  if (isOpen !== undefined && !isOpen) return null;

  const toggleItem = (id: string) => {
    setCheckedIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredItems = selectedCategory === 'ALL' 
    ? CHECKLIST_DATA 
    : CHECKLIST_DATA.filter(item => item.category === selectedCategory);

  const completedCount = Object.values(checkedIds).filter(Boolean).length;
  const totalCount = CHECKLIST_DATA.length;
  const percent = Math.round((completedCount / totalCount) * 100);

  const handleCopyMarkdown = () => {
    const lines = [
      '# App Store Submission Preflight Checklist (Fixit)',
      `Progress: ${completedCount}/${totalCount} (${percent}%)\n`
    ];

    CHECKLIST_DATA.forEach(item => {
      const isChecked = checkedIds[item.id] ? '[x]' : '[ ]';
      lines.push(`- ${isChecked} **${item.title}** (${item.guideline})`);
      lines.push(`  * Recommendation: ${item.recommendation}`);
    });

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
  };

  const content = (
    <div className={`flex flex-col h-full overflow-hidden ${isOpen ? 'bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl border border-slate-200' : ''}`}>
      {/* Header */}
      <div className={`flex items-center justify-between border-b border-slate-200/85 pb-4 shrink-0 ${isOpen ? 'px-6 py-5 bg-slate-50/80' : ''}`}>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 font-mono">
              App Store Review Checklist
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold shadow-3xs">
              2026 Edition
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Interactive pre-submission verification based on published Apple App Store Guidelines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyMarkdown}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-3xs transition-colors cursor-pointer shrink-0"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
            <span>{copied ? 'Copied Markdown!' : 'Copy Checklist'}</span>
          </button>
          
          {isOpen && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Progress & Category Filter bar */}
      <div className={`bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 shadow-3xs ${isOpen ? 'mx-6 mt-4' : 'my-4'}`}>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="text-xs font-semibold text-slate-700 whitespace-nowrap">
            Ready Score: <span className="font-mono text-blue-600 font-bold">{completedCount}/{totalCount}</span> ({percent}%)
          </div>
          <div className="w-full sm:w-44 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs w-full sm:w-auto justify-start sm:justify-end">
          {['ALL', 'PRIVACY', 'AUTH', 'IAP', 'UGC', 'METADATA'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                selectedCategory === cat 
                  ? 'bg-blue-600 text-white shadow-3xs' 
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Checklist Content Body */}
      <div className={`flex-1 overflow-y-auto pr-1 scrollbar-none space-y-3 pb-6 min-h-0 ${isOpen ? 'px-6 pt-4' : ''}`}>
        {filteredItems.map(item => {
          const isChecked = !!checkedIds[item.id];
          return (
            <div
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3.5 ${
                isChecked 
                  ? 'bg-emerald-50/40 border-emerald-200/80 shadow-3xs' 
                  : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-3xs'
              }`}
            >
              <div className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-colors ${
                isChecked 
                  ? 'bg-emerald-600 border-emerald-600 text-white' 
                  : 'border-slate-300 bg-slate-50'
              }`}>
                {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className={`text-xs font-bold ${isChecked ? 'text-emerald-950 line-through opacity-80' : 'text-slate-900'}`}>
                    {item.title}
                  </h3>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-slate-200 bg-slate-100 text-slate-500 font-semibold">
                    {item.guideline}
                  </span>
                  {item.critical && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-bold">
                      BLOCKER
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed mb-2.5">
                  {item.description}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-700 bg-slate-100/70 px-2.5 py-1 rounded-md border border-slate-200/60 w-fit">
                  <span className="text-blue-600 font-bold">Fix:</span>
                  <span>{item.recommendation}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Banner Footer */}
      <div className={`rounded-xl border border-slate-200 bg-white p-3 flex items-center gap-2.5 text-[10px] text-slate-500 shrink-0 shadow-3xs ${isOpen ? 'mx-6 mb-5' : ''}`}>
        <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
        <span>Updated weekly against Apple App Review guidelines and rejection center patterns.</span>
      </div>
    </div>
  );

  if (isOpen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-100">
        {content}
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-slate-50/50 flex flex-col p-6 overflow-hidden">
      {content}
    </div>
  );
};
