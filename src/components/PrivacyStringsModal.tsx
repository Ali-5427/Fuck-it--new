import React, { useState, useRef, useEffect } from 'react';
import { useScrollLock } from '../hooks/useScrollLock';
import { 
  KeyRound, 
  Copy, 
  Check, 
  Search, 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Code,
  Sparkles
} from 'lucide-react';

interface PermissionStringSpec {
  key: string;
  category: 'Media & Camera' | 'Location' | 'Health & Fitness' | 'Hardware & Bluetooth' | 'Identity & Privacy' | 'Personal Data';
  name: string;
  guideline: string;
  appleIntent: string;
  badExample: string;
  goodExample: string;
  xmlSnippet: string;
}

const PERMISSION_STRINGS: PermissionStringSpec[] = [
  {
    key: 'NSCameraUsageDescription',
    name: 'Camera Access',
    category: 'Media & Camera',
    guideline: 'Guideline 5.1.1 Data Collection',
    appleIntent: 'Explains to the user why the app needs access to the device camera.',
    badExample: 'App needs camera access to take photos.',
    goodExample: 'Scan product barcodes and take profile photos directly in your workout diary.',
    xmlSnippet: `<key>NSCameraUsageDescription</key>\n<string>Scan product barcodes and take profile photos directly in your workout diary.</string>`
  },
  {
    key: 'NSPhotoLibraryUsageDescription',
    name: 'Photo Library (Read/Write)',
    category: 'Media & Camera',
    guideline: 'Guideline 5.1.1 Data Collection',
    appleIntent: 'Explains why the app requires read/write access to the user photo library.',
    badExample: 'To upload images.',
    goodExample: 'Select and attach receipt images to your expense reports.',
    xmlSnippet: `<key>NSPhotoLibraryUsageDescription</key>\n<string>Select and attach receipt images to your expense reports.</string>`
  },
  {
    key: 'NSLocationWhenInUseUsageDescription',
    name: 'Location When In Use',
    category: 'Location',
    guideline: 'Guideline 5.1.5 Location Services',
    appleIntent: 'Explains why the app requests location data while active in the foreground.',
    badExample: 'Location is required to give you better app experience.',
    goodExample: 'Track your live running pace, distance, and map your outdoor workout route.',
    xmlSnippet: `<key>NSLocationWhenInUseUsageDescription</key>\n<string>Track your live running pace, distance, and map your outdoor workout route.</string>`
  },
  {
    key: 'NSLocationAlwaysAndWhenInUseUsageDescription',
    name: 'Location Always and When In Use',
    category: 'Location',
    guideline: 'Guideline 5.1.5 Location Services',
    appleIntent: 'Required if app needs continuous background location tracking.',
    badExample: 'For background tracking.',
    goodExample: 'Alert you of approaching turn-by-turn navigation waypoints when your screen is locked.',
    xmlSnippet: `<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>\n<string>Alert you of approaching turn-by-turn navigation waypoints when your screen is locked.</string>`
  },
  {
    key: 'NSMicrophoneUsageDescription',
    name: 'Microphone Access',
    category: 'Media & Camera',
    guideline: 'Guideline 5.1.1 Data Collection',
    appleIntent: 'Explains why the app requests audio input from the device microphone.',
    badExample: 'Need mic to record sound.',
    goodExample: 'Record voice memos for meeting transcription and audio note-taking.',
    xmlSnippet: `<key>NSMicrophoneUsageDescription</key>\n<string>Record voice memos for meeting transcription and audio note-taking.</string>`
  },
  {
    key: 'NSHealthShareUsageDescription',
    name: 'HealthKit Read Access',
    category: 'Health & Fitness',
    guideline: 'Guideline 5.1.3 Health and Health Research',
    appleIntent: 'Explains why the app reads biometric data (steps, active calories, sleep) from Apple Health.',
    badExample: 'Read health data.',
    goodExample: 'Import daily step counts and active heart rate zones to calculate your metabolic recovery score.',
    xmlSnippet: `<key>NSHealthShareUsageDescription</key>\n<string>Import daily step counts and active heart rate zones to calculate your metabolic recovery score.</string>`
  },
  {
    key: 'NSHealthUpdateUsageDescription',
    name: 'HealthKit Write Access',
    category: 'Health & Fitness',
    guideline: 'Guideline 5.1.3 Health and Health Research',
    appleIntent: 'Explains why the app writes finished workout sessions into Apple Health.',
    badExample: 'Save workouts to Health.',
    goodExample: 'Save completed running and cycling sessions back into your Apple Health activity rings.',
    xmlSnippet: `<key>NSHealthUpdateUsageDescription</key>\n<string>Save completed running and cycling sessions back into your Apple Health activity rings.</string>`
  },
  {
    key: 'NSUserTrackingUsageDescription',
    name: 'App Tracking Transparency (ATT)',
    category: 'Identity & Privacy',
    guideline: 'Guideline 5.1.2 Data Use & ATT',
    appleIntent: 'Explains why the app requests permission to track the user across other companies’ apps and websites.',
    badExample: 'Help us improve our ads.',
    goodExample: 'Deliver personalized offers and prevent duplicate sponsored promotions based on your activity.',
    xmlSnippet: `<key>NSUserTrackingUsageDescription</key>\n<string>Deliver personalized offers and prevent duplicate sponsored promotions based on your activity.</string>`
  },
  {
    key: 'NSFaceIDUsageDescription',
    name: 'Face ID / Biometrics',
    category: 'Identity & Privacy',
    guideline: 'Guideline 5.1.1 Data Collection',
    appleIntent: 'Explains why the app uses Face ID to authenticate secure access.',
    badExample: 'Authenticate user.',
    goodExample: 'Unlock your encrypted offline document vault quickly without typing your master password.',
    xmlSnippet: `<key>NSFaceIDUsageDescription</key>\n<string>Unlock your encrypted offline document vault quickly without typing your master password.</string>`
  },
  {
    key: 'NSBluetoothAlwaysUsageDescription',
    name: 'Bluetooth Access',
    category: 'Hardware & Bluetooth',
    guideline: 'Guideline 5.1.1 Data Collection',
    appleIntent: 'Explains why the app connects to external Bluetooth peripheral accessories.',
    badExample: 'Bluetooth is needed for device connection.',
    goodExample: 'Discover and pair with your smart indoor bike trainer and heart rate chest strap.',
    xmlSnippet: `<key>NSBluetoothAlwaysUsageDescription</key>\n<string>Discover and pair with your smart indoor bike trainer and heart rate chest strap.</string>`
  },
  {
    key: 'NSContactsUsageDescription',
    name: 'Contacts Access',
    category: 'Personal Data',
    guideline: 'Guideline 5.1.1 Data Collection',
    appleIntent: 'Explains why the app requests access to address book contacts.',
    badExample: 'Find your friends.',
    goodExample: 'Select teammates from your address book to invite them directly into your shared workspace.',
    xmlSnippet: `<key>NSContactsUsageDescription</key>\n<string>Select teammates from your address book to invite them directly into your shared workspace.</string>`
  },
  {
    key: 'NSCalendarsUsageDescription',
    name: 'Calendar Access',
    category: 'Personal Data',
    guideline: 'Guideline 5.1.1 Data Collection',
    appleIntent: 'Explains why the app accesses calendar events.',
    badExample: 'Sync calendar.',
    goodExample: 'Add scheduled team standup meetings and product launch deadlines directly to your iOS calendar.',
    xmlSnippet: `<key>NSCalendarsUsageDescription</key>\n<string>Add scheduled team standup meetings and product launch deadlines directly to your iOS calendar.</string>`
  }
];

interface PrivacyStringsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyStringsModal: React.FC<PrivacyStringsModalProps> = ({ isOpen, onClose }) => {
  useScrollLock(isOpen);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const categories = ['ALL', 'Media & Camera', 'Location', 'Health & Fitness', 'Identity & Privacy', 'Hardware & Bluetooth', 'Personal Data'];

  const filtered = PERMISSION_STRINGS.filter(item => {
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSearch = item.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.goodExample.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                iOS Privacy & Usage Strings Cheat Sheet
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                  Info.plist
                </span>
              </h2>
              <p className="text-xs text-slate-600">
                Apple-approved purpose descriptions that pass Guideline 5.1.1 App Store review.
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by key (e.g. NSCameraUsageDescription), category, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                  selectedCategory === cat 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
          {filtered.map(spec => (
            <div
              key={spec.key}
              className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all shadow-2xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {spec.key}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      {spec.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{spec.appleIntent}</p>
                </div>

                <button
                  onClick={() => handleCopy(spec.key, spec.xmlSnippet)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0 self-start sm:self-center"
                >
                  {copiedKey === spec.key ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied XML!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-500" />
                      <span>Copy Info.plist XML</span>
                    </>
                  )}
                </button>
              </div>

              {/* Comparison Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                {/* Bad Example */}
                <div className="p-3 rounded-lg bg-red-50/60 border border-red-200 text-xs">
                  <div className="flex items-center gap-1.5 text-red-700 font-bold mb-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>❌ Rejection Risk (Vague)</span>
                  </div>
                  <p className="font-mono text-slate-700 text-[11px] italic bg-white/80 p-2 rounded border border-red-100">
                    "{spec.badExample}"
                  </p>
                  <p className="text-[10px] text-red-600 mt-1">Apple rejects strings that don't state the specific user-facing action.</p>
                </div>

                {/* Good Example */}
                <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold mb-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>✅ Apple-Approved (Passed)</span>
                  </div>
                  <p className="font-mono text-slate-800 text-[11px] bg-white/80 p-2 rounded border border-emerald-100 font-medium">
                    "{spec.goodExample}"
                  </p>
                  <p className="text-[10px] text-emerald-700 mt-1">Explicitly details the exact feature and benefit to the user.</p>
                </div>
              </div>

              {/* XML Preview */}
              <div className="mt-3 bg-slate-900 text-slate-200 p-2.5 rounded-lg font-mono text-[11px] overflow-x-auto flex items-center justify-between">
                <code>{spec.xmlSnippet}</code>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-500 text-xs">
              No permission strings matched "{searchQuery}". Try searching for Camera, Health, or Location.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <span>Compliant with Apple Human Interface Guidelines and Guideline 5.1.1.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
