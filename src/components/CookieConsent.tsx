import React, { useState } from 'react';
import { hasAnalyticsConsent, setAnalyticsConsent, trackEvent } from '../services/telemetry';

const CONSENT_KEY = 'fixit_analytics_consent';

export const CookieConsent: React.FC = () => {
  const [visible, setVisible] = useState(() => localStorage.getItem(CONSENT_KEY) === null);

  const choose = (granted: boolean) => {
    setAnalyticsConsent(granted);
    if (granted) trackEvent({ name: 'analytics_consent_granted' });
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <section role="dialog" aria-modal="false" aria-label="Cookie preferences" className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
      <h2 className="text-sm font-bold text-slate-900">Privacy choices</h2>
      <p className="mt-2 text-xs leading-relaxed text-slate-600">
        Essential storage keeps the app working. Optional analytics are used only if you accept them. Read our <a className="font-semibold text-blue-700 underline" href="/cookies">Cookie Policy</a>.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => choose(false)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">Reject analytics</button>
        <button onClick={() => choose(true)} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white">Accept analytics</button>
      </div>
    </section>
  );
};
