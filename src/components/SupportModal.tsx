import React, { useState, useRef, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  Check, 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  Copy, 
  MessageSquare,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { siteConfig } from '../config/site';
import { useScrollLock } from '../hooks/useScrollLock';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  useScrollLock(isOpen);
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('App Store Rejection Assistance');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const supportEmail = siteConfig.supportEmail;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message || !supportEmail) return;
    window.location.href = `mailto:${supportEmail}?subject=${encodeURIComponent(`[Fixit] ${subject}`)}&body=${encodeURIComponent(`Reply-to: ${email}\n\n${message}`)}`;
  };

  const handleCopyEmail = () => {
    if (!supportEmail) return;
    navigator.clipboard.writeText(supportEmail);
    setCopiedEmail(true);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                Developer Support & Guidance
              </h2>
              <p className="text-xs text-slate-600">
                Direct assistance with App Review rejections, custom rules, and privacy manifests.
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {submitted ? (
            <div className="py-10 text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <Check className="h-7 w-7 stroke-[3]" />
              </div>
              <h3 className="text-lg font-bold text-slate-950">Inquiry Received!</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Thank you for contacting Fixit support. An iOS compliance specialist has received your case and will respond to <strong className="text-slate-900 font-mono">{email}</strong> within 2 hours.
              </p>
              <div className="pt-4">
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setMessage('');
                    onClose();
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  Return to Console
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Direct email banner */}
              <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200/80 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-blue-900">
                  <Mail className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>Direct email: <strong className="font-mono">{supportEmail || 'Support email is not configured'}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  disabled={!supportEmail}
                  className="px-2.5 py-1 rounded bg-white hover:bg-slate-50 border border-blue-200 text-blue-700 font-semibold text-[11px] shadow-2xs flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {copiedEmail ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-slate-400" />}
                  <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Your Developer Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="developer@studio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Inquiry Topic
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 cursor-pointer"
                >
                  <option value="App Store Rejection Assistance">App Store Rejection Assistance (Resolution Center)</option>
                  <option value="Privacy Manifest & Required Reason API Help">Privacy Manifest & Required Reason API Help</option>
                  <option value="StoreKit & In-App Subscription Review">StoreKit & In-App Subscription Review</option>
                  <option value="Custom CI/CD Integration Question">Custom CI/CD Integration Question</option>
                  <option value="Account or Billing Support">Account or Billing Support</option>
                  <option value="Other Technical Question">Other Technical Question</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Details / Apple Rejection Text
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Paste Apple reviewer notes, rejection message snippets, or describe your app issue..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                  Configure a support mailbox before launch.
                </span>
                
                <button
                  type="submit"
                  disabled={!supportEmail}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Inquiry</span>
                </button>
              </div>

            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Fixit iOS Engineering Support</span>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};
