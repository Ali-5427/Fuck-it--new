import React, { useState, useEffect } from 'react';
import { 
  X, 
  User as UserIcon, 
  Lock, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  Github, 
  Key, 
  Smartphone,
  Copy,
  CheckCircle2,
  Building2,
  Loader2
} from 'lucide-react';
import { authService } from '../services/authService';
import { store } from '../services/store';
import { useScrollLock } from '../hooks/useScrollLock';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'forgot';
  initialTier?: 'free' | 'pro' | 'studio';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialMode = 'login',
  initialTier = 'pro',
  onSuccess
}) => {
  useScrollLock(isOpen);
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [tier, setTier] = useState<'free' | 'pro' | 'studio'>(initialTier);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [appleTeamId, setAppleTeamId] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setTier(initialTier);
      setErrorMsg(null);
      setMsg(null);
    }
  }, [isOpen, initialMode, initialTier]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setMsg(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        if (!email) throw new Error('Please enter your developer email.');
        if (!password) throw new Error('Please enter your password.');
        await authService.loginWithEmail(email, password);
        if (onSuccess) onSuccess();
        onClose();
      } else if (mode === 'register') {
        if (!email) throw new Error('Please enter your email.');
        if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.');
        const regName = name || (email ? email.split('@')[0] : 'iOS Developer');
        await authService.registerWithEmail(
          email, 
          password, 
          regName, 
          tier, 
          appleTeamId || 'DEV' + Math.random().toString(36).substring(2, 8).toUpperCase(), 
          teamName || 'Indie Studio'
        );
        if (onSuccess) onSuccess();
        onClose();
      } else if (mode === 'forgot') {
        if (!email) throw new Error('Please enter your registered email address.');
        await authService.sendPasswordReset(email);
        setMsg(`Password reset email sent to ${email}. Check your inbox!`);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let message = err.message || 'Authentication failed. Please check your credentials.';
      if (err.error === 'INVALID_CREDENTIALS' || err.statusCode === 401) {
        message = 'Invalid email or password. If you do not have an account yet, please sign up or use Google Sign-in.';
      } else if (err.error === 'EMAIL_ALREADY_IN_USE' || err.error === 'USER_ALREADY_EXISTS') {
        message = 'This email is already registered. Please sign in instead.';
      } else if (err.error === 'WEAK_PASSWORD') {
        message = 'Password must be at least 6 characters.';
      }
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const loggedInUser = await authService.signInWithGoogle();
      if (loggedInUser) {
        if (onSuccess) onSuccess();
        onClose();
        return;
      }

      // OAuth redirect flow — browser will navigate to Google, then back
      setMsg('Redirecting to Google sign-in...');
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      const isNetworkError = err.message?.includes('Failed to fetch') || err.message?.includes('Network request failed');
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(
          isNetworkError
            ? 'Unable to connect to the auth server. Please check your internet connection and try again.'
            : (err.message || 'Failed to sign in with Google. Please try again.')
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden p-6 space-y-5 max-h-[95vh] overflow-y-auto">
        
        <button
          id="auth_modal_close_btn"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-slate-900">
              {mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Create an account' : 'Reset password'}
            </h3>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              {mode === 'login' ? 'Enter your details to sign in to Fixit.' : mode === 'register' ? 'Start auditing iOS binaries and resolving App Review risks.' : 'We will send recovery instructions.'}
            </p>
          </div>
        </div>

        {/* Google SSO */}
        <div className="space-y-3">
          <button
            type="button"
            id="auth_google_btn"
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-2 px-3 text-sm font-semibold text-slate-700 transition-all shadow-sm cursor-pointer"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200"></div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">or continue with</span>
            <div className="h-px flex-1 bg-slate-200"></div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          
          {mode === 'register' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white px-3 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Team / Org <span className="text-slate-400 font-normal">(Optional)</span></label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white px-3 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white px-3 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:outline-none transition-all"
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                {mode === 'login' && (
                  <button type="button" onClick={() => setMode('forgot')} className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer">
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white px-3 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:outline-none transition-all"
              />
            </div>
          )}

          {mode === 'login' && (
            <div className="flex items-center text-xs text-slate-600 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                />
                <span className="font-medium">Remember for 30 days</span>
              </label>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700 animate-in fade-in">
              {errorMsg}
            </div>
          )}

          {msg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-2 animate-in fade-in">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{msg}</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">Follow the reset instructions sent to your email address.</p>
                </div>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all cursor-pointer"
            >
              <span>{isLoading ? 'Authenticating...' : mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Send Instructions'}</span>
            </button>
          </div>
        </form>

        {/* Footer Mode Switcher */}
        <div className="text-center text-sm text-slate-500 pt-2">
          {mode === 'login' ? (
            <span>
              Don't have an account?{' '}
              <button 
                type="button" 
                onClick={() => setMode('register')} 
                className="text-slate-900 hover:underline font-semibold cursor-pointer"
              >
                Sign up
              </button>
            </span>
          ) : mode === 'register' ? (
            <span>
              Already have an account?{' '}
              <button 
                type="button" 
                onClick={() => setMode('login')} 
                className="text-slate-900 hover:underline font-semibold cursor-pointer"
              >
                Log in
              </button>
            </span>
          ) : (
            <button 
              type="button" 
              onClick={() => setMode('login')} 
              className="text-slate-900 hover:underline font-semibold cursor-pointer text-sm"
            >
              Back to log in
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
