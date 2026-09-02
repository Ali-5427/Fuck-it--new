import React from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';

interface SiteFooterProps {
  onStartAudit?: () => void;
  onOpenRejectionAnalyzer?: () => void;
  onOpenChecklist?: () => void;
  onOpenPrivacyStrings?: () => void;
  onOpenStatus?: () => void;
  onOpenSupport?: () => void;
  onOpenAuth?: (mode: 'login' | 'register') => void;
}

export const SiteFooter: React.FC<SiteFooterProps> = ({
  onStartAudit,
  onOpenRejectionAnalyzer,
  onOpenChecklist,
  onOpenPrivacyStrings,
  onOpenStatus,
  onOpenSupport,
  onOpenAuth,
}) => {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      // If not on landing page, go there
      window.location.href = `/#${id}`;
    }
  };

  return (
    <footer className="border-t border-slate-200 bg-slate-50/70 pt-10 pb-5 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="mx-auto max-w-5xl relative z-10">

        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12">

          {/* Brand Column */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-600 text-white shadow-md shadow-blue-600/20">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="font-bold text-xl text-slate-950 font-mono tracking-tight">Fixit</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm">
              The preflight check for iOS developers shipping on the App Store. Find risks, fix issues, and submit with confidence.
            </p>
            {onStartAudit && (
              <div className="pt-2">
                <button
                  onClick={onStartAudit}
                  className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 text-xs transition-colors shadow-sm cursor-pointer"
                >
                  <span>Start a free check</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          {/* Nav Columns */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs">

            {/* PRODUCT */}
            <div>
              <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-4">PRODUCT</h4>
              <ul className="space-y-2.5 text-slate-600 font-medium">
                <li>
                  <button onClick={() => scrollTo('product-showcase')} className="hover:text-blue-600 transition-colors cursor-pointer text-left">
                    Features
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollTo('how-it-works')} className="hover:text-blue-600 transition-colors cursor-pointer text-left">
                    How it works
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollTo('pricing')} className="hover:text-blue-600 transition-colors cursor-pointer text-left">
                    Pricing
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollTo('faq')} className="hover:text-blue-600 transition-colors cursor-pointer text-left">
                    FAQ
                  </button>
                </li>
              </ul>
            </div>



            {/* CONNECT */}
            <div>
              <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-4">CONNECT</h4>
              <ul className="space-y-2.5 text-slate-600 font-medium">
                <li>
                  <button onClick={() => onOpenAuth?.('login')} className="hover:text-blue-600 transition-colors cursor-pointer text-left">
                    Sign in
                  </button>
                </li>
                <li>
                  <button onClick={() => onOpenAuth?.('register')} className="hover:text-blue-600 transition-colors cursor-pointer text-left">
                    Create Account
                  </button>
                </li>
                <li>
                  <button onClick={onOpenSupport} className="hover:text-blue-600 transition-colors cursor-pointer text-left">
                    Support Email
                  </button>
                </li>
                <li>
                  <button onClick={onOpenStatus} className="hover:text-blue-600 transition-colors cursor-pointer text-left">
                    Status Page
                  </button>
                </li>
              </ul>
            </div>

            {/* LEGAL */}
            <div>
              <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-4">LEGAL</h4>
              <ul className="space-y-2.5 text-slate-600 font-medium">
                <li><a href="/privacy" className="hover:text-blue-600 transition-colors">Privacy</a></li>
                <li><a href="/terms" className="hover:text-blue-600 transition-colors">Terms</a></li>
                <li><a href="/dpa" className="hover:text-blue-600 transition-colors">DPA</a></li>
                <li><a href="/cookies" className="hover:text-blue-600 transition-colors">Cookies</a></li>
                <li><a href="/refunds" className="hover:text-blue-600 transition-colors">Refunds</a></li>
              </ul>
            </div>

          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-5 border-t border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 font-mono">
          <p>© {new Date().getFullYear()} Fixit. All rights reserved.</p>
          <p>Fixit is not affiliated with or endorsed by Apple Inc.</p>
        </div>

        {/* Big Watermark */}
        <div className="w-full text-center overflow-hidden select-none pointer-events-none pt-4 pb-0 -mb-4 md:-mb-6">
          <span className="text-[17vw] lg:text-[210px] font-black tracking-tight text-blue-600/10 leading-none block font-mono">
            Fixit
          </span>
        </div>

      </div>
    </footer>
  );
};
