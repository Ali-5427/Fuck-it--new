import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Menu,
  X,
  ArrowRight
} from 'lucide-react';
import { store } from '../services/store';
import { Application, User } from '../types';

interface NavbarProps {
  currentView: 'landing' | 'dashboard' | 'audit' | 'rejection' | 'metadata' | 'screenshots' | 'admin' | 'privacy';
  onNavigate: (view: 'landing' | 'dashboard' | 'audit' | 'rejection' | 'metadata' | 'screenshots' | 'admin' | 'privacy') => void;
  onOpenUpload: () => void;
  onOpenAuth: (mode?: 'login' | 'register', tier?: 'free' | 'pro' | 'studio') => void;
  onOpenAccount?: () => void;
  user: User | null;
  selectedApp: Application | null;
  apps: Application[];
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenUpload,
  onOpenAuth,
  onOpenAccount,
  user,
  selectedApp,
  apps
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToLandingSection = (sectionId: string) => {
    if (currentView !== 'landing') {
      onNavigate('landing');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full transition-all">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-4 pb-2">
        <div className="flex h-14 items-center justify-between rounded-full border border-slate-200/60 bg-transparent px-5 sm:px-7 backdrop-blur-[4px] shadow-xs" style={{ boxShadow: 'inset 0 1.5px 0 rgba(255, 255, 255, 0.95), 0 8px 30px rgba(0, 0, 0, 0.03)' }}>
          
          {/* Left: Fixit Logo & Name */}
          <div className="flex items-center gap-3">
            <button 
              id="nav_brand_logo"
              onClick={() => onNavigate(user ? 'dashboard' : 'landing')}
              className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer"
            >
              <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
                <ShieldCheck className="h-4.5 w-4.5 text-white" />
              </div>
              <span className="font-bold text-base tracking-tight text-slate-900 font-mono">Fixit</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {user ? (
              <>
                <button
                  id="nav_link_dashboard"
                  onClick={() => onNavigate('dashboard')}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    currentView === 'dashboard'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  My Apps
                </button>

                {selectedApp && (
                  <button
                    id="nav_link_current_app"
                    onClick={() => onNavigate('audit')}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                      currentView === 'audit'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    Current Check ({selectedApp.name})
                  </button>
                )}

                <button
                  id="nav_link_rejection"
                  onClick={() => onNavigate('rejection')}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    currentView === 'rejection'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  Rejection Solver
                </button>
              </>
            ) : (
              <>
                <button
                  id="nav_link_product"
                  onClick={() => scrollToLandingSection('product-showcase')}
                  className="rounded-full px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors cursor-pointer"
                >
                  Product
                </button>

                <button
                  id="nav_link_how_it_works"
                  onClick={() => scrollToLandingSection('how-it-works')}
                  className="rounded-full px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors cursor-pointer"
                >
                  How it works
                </button>

                <button
                  id="nav_link_pricing"
                  onClick={() => scrollToLandingSection('pricing')}
                  className="rounded-full px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors cursor-pointer"
                >
                  Pricing
                </button>

                <button
                  id="nav_link_faq"
                  onClick={() => scrollToLandingSection('faq')}
                  className="rounded-full px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors cursor-pointer"
                >
                  FAQ
                </button>
              </>
            )}
          </nav>

          {/* Right Action: User account / Sign in button */}
          <div className="flex items-center gap-2.5">
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  id="nav_check_app_btn"
                  onClick={onOpenUpload}
                  className="hidden sm:inline-flex items-center gap-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <span>+ Check app</span>
                </button>

                <button
                  id="nav_user_account_btn"
                  onClick={() => onOpenAccount ? onOpenAccount() : onNavigate('dashboard')}
                  className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 transition-all shadow-xs cursor-pointer"
                  title="Settings & Account"
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="max-w-[100px] truncate">{user.name || user.email.split('@')[0]}</span>
                </button>
              </div>
            ) : (
              <button
                id="nav_sign_in_btn"
                onClick={() => onOpenAuth('login')}
                className="flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 text-sm font-bold transition-all shadow-md shadow-blue-600/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <span className="text-base leading-none">Sign in</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              id="nav_mobile_toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden rounded-full border border-slate-200 p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden mx-4 mt-2 rounded-3xl border border-slate-200 bg-white p-5 space-y-3 shadow-2xl animate-in slide-in-from-top-2 duration-150 text-slate-800">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 font-mono">
            Navigation
          </div>

          {user ? (
            <>
              <button
                onClick={() => {
                  onNavigate('dashboard');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-left text-slate-700 hover:bg-slate-100"
              >
                My Apps
              </button>

              {selectedApp && (
                <button
                  onClick={() => {
                    onNavigate('audit');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-left text-slate-700 hover:bg-slate-100"
                >
                  Current Check ({selectedApp.name})
                </button>
              )}

              <button
                onClick={() => {
                  onNavigate('rejection');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-left text-slate-700 hover:bg-slate-100"
              >
                Rejection Solver
              </button>

              <button
                onClick={() => {
                  onOpenUpload();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-left text-blue-600 bg-blue-50"
              >
                + Check a new app
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => scrollToLandingSection('product-showcase')}
                className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-left text-slate-700 hover:bg-slate-100"
              >
                Product
              </button>

              <button
                onClick={() => scrollToLandingSection('how-it-works')}
                className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-left text-slate-700 hover:bg-slate-100"
              >
                How it works
              </button>

              <button
                onClick={() => scrollToLandingSection('pricing')}
                className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-left text-slate-700 hover:bg-slate-100"
              >
                Pricing
              </button>

              <button
                onClick={() => scrollToLandingSection('faq')}
                className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-left text-slate-700 hover:bg-slate-100"
              >
                FAQ
              </button>
            </>
          )}

          <div className="my-2 border-t border-slate-100"></div>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              user ? (onOpenAccount ? onOpenAccount() : onNavigate('dashboard')) : onOpenAuth('login');
            }}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/30 cursor-pointer"
          >
            <span>{user ? 'Account Settings' : 'Sign in'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </header>
  );
};
