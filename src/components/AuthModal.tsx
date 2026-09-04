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
  // OTP verification step (after registration when email verification is required)
  const [needsOtp, setNeedsOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [pendingRegEmail, setPendingRegEmail] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setTier(initialTier);
      setErrorMsg(null);
      setMsg(null);
      setNeedsOtp(false);
      setOtp('');
      setPendingRegEmail('');
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
        const result = await authService.registerWithEmail(
          email, 
          password, 
          regName, 
          tier, 
          appleTeamId || 'DEV' + Math.random().toString(36).substring(2, 8).toUpperCase(), 
          teamName || 'Indie Studio'
        );
        // If registration requires email verification (OTP code), show the OTP step
        if (result === 'needs_verification') {
          setPendingRegEmail(email);
          setNeedsOtp(true);
          setMsg(`A 6-digit verification code was sent to ${email}. Enter it below.`);
        } else {
          if (onSuccess) onSuccess();
          onClose();
        }
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

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setErrorMsg('Please enter the 6-digit code sent to your email.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await authService.verifyEmailOtp(pendingRegEmail, otp);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('OTP verification error:', err);
      setErrorMsg(err.message || 'Invalid or expired code. Please try again.');
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
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden p-6 space-y-5 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight font-mono">
                {mode === 'login' ? 'Sign In to Fixit' : mode === 'register' ? 'Create Developer Account' : 'Reset Password'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {mode === 'login' ? 'Access your App Store preflight audits' : mode === 'register' ? 'Inspect iOS binaries and resolve App Review risks' : 'We will send one-time recovery instructions'}
              </p>
            </div>
          </div>
          <button
            id="auth_modal_close_btn"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* OTP Verification Step (after registration) */}
        {needsOtp ? (
          <form onSubmit={handleOtpVerify} className="space-y-4">
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-slate-800">Check your email</p>
              <p className="text-xs text-slate-500">We sent a 6-digit code to <span className="font-semibold text-slate-700">{pendingRegEmail}</span></p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Verification Code</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full text-center rounded-xl border border-slate-300 bg-white px-3 py-3 text-lg font-mono tracking-widest text-slate-900 focus:border-blue-500 focus:outline-none"
                autoFocus
              />
            </div>
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">{errorMsg}</div>
            )}
            {msg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{msg}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={isLoading || otp.length < 6}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all font-mono cursor-pointer"
            >
              <span>{isLoading ? 'Verifying...' : 'Verify & Continue'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => { setNeedsOtp(false); setOtp(''); setMsg(null); setErrorMsg(null); }}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              ← Back to sign up
            </button>
          </form>
        ) : (

        {/* Google SSO */}
        <div className="space-y-3">
          <button
            type="button"
            id="auth_google_btn"
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-2.5 px-3 text-xs font-semibold text-slate-800 transition-all shadow-xs cursor-pointer hover:border-blue-300 group"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span className="group-hover:text-blue-600">Continue with Google</span>
          </button>

          <div className="flex items-center gap-2 py-1">
            <div className="h-px flex-1 bg-slate-200"></div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">or with email</span>
            <div className="h-px flex-1 bg-slate-200"></div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          
          {/* Plan Selector when in Register mode */}
                    {/* Plan selector removed per user request */}

          {mode === 'register' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Steve Wozniak"
                    className="w-full rounded-xl border border-slate-300 bg-white pl-8 pr-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Team / Org (Optional)</label>
                <div className="relative">
                  <Building2 className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Apex Mobile LLC"
                    className="w-full rounded-xl border border-slate-300 bg-white pl-8 pr-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Developer Email</label>
            <div className="relative">
              <Mail className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@example.com"
                className="w-full rounded-xl border border-slate-300 bg-white pl-8 pr-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <label className="font-semibold text-slate-700">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-blue-600 hover:underline text-[11px] font-medium cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 bg-white pl-8 pr-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}



          {mode === 'login' && (
            <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                />
                <span>Remember this developer session</span>
              </label>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 animate-in fade-in">
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all font-mono cursor-pointer"
          >
            <span>{isLoading ? 'Authenticating...' : mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Send Instructions'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Footer Mode Switcher */}
        <div className="pt-3 border-t border-slate-200 text-center text-xs text-slate-500">
          {mode === 'login' ? (
            <span>
              Don't have an account?{' '}
              <button 
                type="button" 
                onClick={() => setMode('register')} 
                className="text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                Sign up free
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button 
                type="button" 
                onClick={() => setMode('login')} 
                className="text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                Sign in
              </button>
            </span>
          )}
        </div>

        )} {/* end needsOtp ternary */}

      </div>
    </div>
  );
};
