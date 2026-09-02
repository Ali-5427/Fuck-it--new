import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Smartphone, 
  RotateCw, 
  MessageSquareWarning, 
  Settings, 
  LogOut, 
  Plus, 
  ShieldCheck, 
  CheckCircle2, 
  ChevronRight,
  Menu,
  X,
  FileCheck2,
  HelpCircle,
  FileText
} from 'lucide-react';
import { store } from '../services/store';
import { authService } from '../services/authService';
import { Application, User } from '../types';
import { useScrollLock } from '../hooks/useScrollLock';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: 'landing' | 'dashboard' | 'audit' | 'rejection' | 'metadata' | 'screenshots' | 'admin' | 'privacy' | 'checklist') => void;
  onOpenUpload: () => void;
  onOpenAccount: () => void;
  onOpenChecklist?: () => void;
  user: User | null;
  apps: Application[];
  selectedApp: Application | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  onOpenUpload,
  onOpenAccount,
  onOpenChecklist,
  user,
  apps,
  selectedApp
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  useScrollLock(isMobileOpen);

  const handleSignOut = async () => {
    try {
      await authService.signOut();
    } catch (err) {
      console.warn('Sidebar signout warning:', err);
      store.logout();
    }
    onNavigate('landing');
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'My Apps',
      icon: LayoutDashboard,
      view: 'dashboard' as const,
      badge: apps.length > 0 ? String(apps.length) : undefined
    },
    {
      id: 'rejection',
      label: 'Fix a Rejection',
      icon: MessageSquareWarning,
      view: 'rejection' as const
    },
    {
      id: 'checklist',
      label: 'Final Checklist',
      icon: FileCheck2,
      view: 'checklist' as const
    }
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            id="mobile_sidebar_toggle"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs shadow-xs">
              FI
            </div>
            <span className="font-bold text-slate-900 font-mono text-sm tracking-tight">Fixit</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Check app</span>
          </button>
          <button
            onClick={onOpenAccount}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200"
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </button>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Persistent Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Logo & Tagline */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-100 shrink-0">
          <button
            onClick={() => {
              onNavigate('dashboard');
              setIsMobileOpen(false);
            }}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <span className="font-mono font-black text-xs tracking-tighter">FI</span>
            </div>
            <div>
              <span className="font-bold text-slate-900 font-mono text-sm tracking-tight group-hover:text-blue-600 transition-colors">
                Fixit
              </span>
              <span className="block text-[10px] text-slate-400 font-mono">App Store Preflight</span>
            </div>
          </button>
          
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Primary CTA */}
        <div className="p-3.5 border-b border-slate-100 shrink-0">
          <button
            id="sidebar_check_new_app_btn"
            onClick={() => {
              onOpenUpload();
              setIsMobileOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-3 text-xs font-bold transition-all shadow-sm shadow-blue-600/20 active:scale-[0.98] cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Check a new app</span>
          </button>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto p-3 space-y-6 min-h-0">
          
          {/* Main Views */}
          <div className="space-y-1">
            <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Workspace
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.view;
              return (
                <button
                  key={item.id}
                  id={`sidebar_nav_${item.id}`}
                  onClick={() => {
                    onNavigate(item.view);
                    setIsMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    isActive 
                      ? 'bg-blue-50 text-blue-700 font-bold' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${
                      isActive ? 'bg-blue-200/60 text-blue-800 font-bold' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>



          {/* Apps List Quick Switcher */}
          {apps.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                <span>Recent Apps</span>
                <span className="text-[9px] font-normal lowercase">({apps.length})</span>
              </div>
              <div className="space-y-0.5">
                {apps.slice(0, 5).map((app) => {
                  const isSelected = selectedApp?.id === app.id && currentView === 'audit';
                  return (
                    <button
                      key={app.id}
                      id={`sidebar_app_${app.id}`}
                      onClick={() => {
                        store.selectApp(app.id);
                        onNavigate('audit');
                        setIsMobileOpen(false);
                      }}
                      className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors cursor-pointer group text-left ${
                        isSelected 
                          ? 'bg-slate-100 text-slate-900 font-bold' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md font-mono text-[10px] font-bold ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                        }`}>
                          {app.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate">{app.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        v{app.currentVersion || '1.0'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}



        </div>

        {/* User Account & Bottom Actions */}
        <div className="border-t border-slate-100 p-3 bg-slate-50/50 space-y-2.5 shrink-0">
          {user && (
            <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    onOpenAccount();
                    setIsMobileOpen(false);
                  }}
                  className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer hover:opacity-80 transition-opacity"
                  title="Account Settings"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                      {user.name || user.email.split('@')[0]}
                    </p>
                    <p className="text-[10px] font-mono text-slate-500 truncate">
                      {user.email}
                    </p>
                  </div>
                </button>

                <button
                  id="sidebar_settings_btn"
                  onClick={() => {
                    onOpenAccount();
                    setIsMobileOpen(false);
                  }}
                  title="Settings"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <button
            id="sidebar_sign_out_btn"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign out</span>
          </button>
        </div>

      </aside>
    </>
  );
};
