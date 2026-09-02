import React, { useState, useEffect } from 'react';
import { siteConfig } from '../config/site';
import { authService } from '../services/authService';
import { ShieldCheck, CheckCircle2, Lock, ArrowRight, Key, Loader2, AlertCircle } from 'lucide-react';

type LegalPage = 'privacy' | 'terms' | 'dpa' | 'cookies' | 'refunds';

// ─── Page Definitions ────────────────────────────────────────────────────────

const pages: Record<LegalPage, { title: string; lastUpdated: string; intro: string; sections: Array<{ heading: string; body: React.ReactNode }> }> = {

  // ── PRIVACY POLICY ──────────────────────────────────────────────────────────
  privacy: {
    title: 'Privacy Policy',
    lastUpdated: 'August 26, 2025',
    intro: 'Fixit ("we", "us", or "our") is committed to protecting your personal information. This Privacy Policy explains what data we collect, how we use it, and your rights as a user.',
    sections: [
      {
        heading: '1. Information We Collect',
        body: (
          <>
            <p>We collect the following categories of information when you use Fixit:</p>
            <ul>
              <li><strong>Account Information:</strong> Your name, email address, and password (stored as a secure hash) when you create an account.</li>
              <li><strong>App Submission Data:</strong> The iOS application files (.ipa, .zip, metadata) you upload for preflight analysis. This data is processed to detect App Store Review risks and is not used for any other purpose.</li>
              <li><strong>Usage Data:</strong> Information about how you interact with the service — pages visited, features used, audit history, and session duration — to help us improve the product.</li>
              <li><strong>Device &amp; Technical Information:</strong> Browser type, operating system, IP address, and general location (country/region level) for security and abuse prevention.</li>
              <li><strong>Payment Information:</strong> Billing details such as card type and last four digits, if a paid plan is enabled in the future. We do not store full card numbers.</li>
            </ul>
          </>
        ),
      },
      {
        heading: '2. How We Use Your Information',
        body: (
          <>
            <p>We use collected data to:</p>
            <ul>
              <li>Provide, operate, and improve the Fixit preflight audit service.</li>
              <li>Analyze submitted app files and generate actionable compliance reports.</li>
              <li>Authenticate your identity and keep your account secure.</li>
              <li>Process subscription payments and send billing receipts.</li>
              <li>Send you product updates, security alerts, and support responses. You can opt out of marketing emails at any time.</li>
              <li>Detect, investigate, and prevent fraudulent activity or abuse of the platform.</li>
              <li>Comply with legal obligations.</li>
            </ul>
          </>
        ),
      },
      {
        heading: '3. Data Sharing',
        body: (
          <p>
            We do <strong>not</strong> sell your personal data. We share data only with trusted third-party service providers who help us operate Fixit (e.g., cloud hosting, payment processing, error monitoring), and only to the extent necessary for those services. All providers are bound by data processing agreements and must handle your data in compliance with applicable privacy laws. We may also disclose information if required by law or to protect the rights, property, or safety of our users.
          </p>
        ),
      },
      {
        heading: '4. Data Retention',
        body: (
          <p>
            We retain account and audit metadata only as long as needed for your authenticated session and saved review history. Uploaded IPA/ZIP files are processed in-browser for inspection; they are not stored as permanent server-side app mirrors. App Store Connect credentials are encrypted before saving, and audit JSON remains associated with your account records as needed for review history and comparisons.
          </p>
        ),
      },
      {
        heading: '5. Security',
        body: (
          <p>
            We implement industry-standard security measures including TLS encryption for data in transit, AES-256 encryption for data at rest, access controls, and regular security audits. Despite these measures, no internet transmission is 100% secure, and we encourage you to use a strong, unique password for your account.
          </p>
        ),
      },
      {
        heading: '6. Your Rights',
        body: (
          <>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul>
              <li><strong>Access</strong> the personal data we hold about you.</li>
              <li><strong>Correct</strong> inaccurate or incomplete information.</li>
              <li><strong>Delete</strong> your account and associated personal data.</li>
              <li><strong>Export</strong> your data in a portable format.</li>
              <li><strong>Object</strong> to or restrict certain types of processing.</li>
              <li><strong>Withdraw consent</strong> for optional analytics or marketing communications.</li>
            </ul>
            <p>To exercise any of these rights, contact us at the email listed at the bottom of this page.</p>
          </>
        ),
      },
      {
        heading: '7. Cookies',
        body: (
          <p>
            We use essential cookies to keep the service functional (e.g., authentication session) and optional analytics cookies to understand usage patterns. You can manage your cookie preferences at any time via our Cookie Settings. See our <a href="/cookies" className="text-blue-600 underline">Cookie Policy</a> for full details.
          </p>
        ),
      },
      {
        heading: '8. Children\'s Privacy',
        body: (
          <p>
            Fixit is not directed to children under the age of 13. We do not knowingly collect personal data from children. If you believe a child has provided us with personal data, please contact us immediately so we can delete it.
          </p>
        ),
      },
      {
        heading: '9. Changes to This Policy',
        body: (
          <p>
            We may update this Privacy Policy from time to time. If we make material changes, we will notify you via email or a prominent notice in the app at least 14 days before the changes take effect. Continued use of Fixit after that date constitutes your acceptance of the updated policy.
          </p>
        ),
      },
    ],
  },

  // ── TERMS OF SERVICE ────────────────────────────────────────────────────────
  terms: {
    title: 'Terms of Service',
    lastUpdated: 'August 26, 2025',
    intro: 'These Terms of Service ("Terms") govern your access to and use of Fixit. By creating an account or using the service you agree to be bound by these Terms.',
    sections: [
      {
        heading: '1. About Fixit',
        body: (
          <p>
            Fixit is an automated preflight analysis tool for iOS developers. It scans application binaries, metadata, and configuration files to identify potential App Store Review risks before submission. Fixit provides guidance only — it does not guarantee App Store approval and does not replace advice from Apple or qualified legal counsel.
          </p>
        ),
      },
      {
        heading: '2. Eligibility',
        body: (
          <p>
            You must be at least 18 years old and have the legal authority to enter into these Terms to use Fixit. By using the service you confirm that all information you provide is accurate and that you are authorized to submit the applications and files you upload.
          </p>
        ),
      },
      {
        heading: '3. Account Responsibilities',
        body: (
          <>
            <p>You are responsible for:</p>
            <ul>
              <li>Maintaining the confidentiality of your login credentials.</li>
              <li>All activity that occurs under your account.</li>
              <li>Notifying us immediately at our support email if you believe your account has been compromised.</li>
            </ul>
          </>
        ),
      },
      {
        heading: '4. Acceptable Use',
        body: (
          <>
            <p>You agree not to:</p>
            <ul>
              <li>Upload files that contain malware, spyware, or any malicious code.</li>
              <li>Submit applications that violate applicable laws or regulations.</li>
              <li>Attempt to reverse-engineer, decompile, or access unauthorized parts of the Fixit platform.</li>
              <li>Use the service to harass, abuse, or harm other users.</li>
              <li>Resell or sublicense access to Fixit without our written consent.</li>
              <li>Use automated bots or scripts to abuse the API or audit system.</li>
            </ul>
          </>
        ),
      },
      {
        heading: '5. Subscriptions and Billing',
        body: (
          <p>
            Fixit offers free and paid subscription tiers. Paid subscriptions are billed monthly or annually in advance. Prices are shown in USD and may be subject to applicable taxes. We reserve the right to change pricing with at least 30 days' notice to active subscribers. Failure to pay may result in downgrade or suspension of your account.
          </p>
        ),
      },
      {
        heading: '6. Intellectual Property',
        body: (
          <p>
            All content, technology, trademarks, and intellectual property within Fixit are owned by us or our licensors. Your use of the service does not grant you any ownership rights. You retain full ownership of all application files and data you upload — we do not claim any rights over your apps.
          </p>
        ),
      },
      {
        heading: '7. Limitation of Liability',
        body: (
          <p>
            To the maximum extent permitted by applicable law, Fixit and its team shall not be liable for any indirect, incidental, special, consequential, or punitive damages — including loss of revenue, loss of data, or App Store rejection — arising out of or related to your use of the service, even if we have been advised of the possibility of such damages. Our total liability to you for any claim shall not exceed the amount you paid us in the 12 months preceding the event giving rise to the claim.
          </p>
        ),
      },
      {
        heading: '8. Disclaimer of Warranties',
        body: (
          <p>
            Fixit is provided "as is" and "as available" without warranties of any kind, whether express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that the service will be uninterrupted, error-free, or that analysis results will be 100% accurate.
          </p>
        ),
      },
      {
        heading: '9. Termination',
        body: (
          <p>
            You may cancel your account at any time through your account settings. We reserve the right to suspend or terminate accounts that violate these Terms, with or without notice. Upon termination, your access to paid features will end at the close of the current billing period, and your data will be deleted in accordance with our Privacy Policy.
          </p>
        ),
      },
      {
        heading: '10. Governing Law',
        body: (
          <p>
            These Terms are governed by and construed in accordance with applicable law. Any disputes arising under these Terms shall be resolved through binding arbitration, except where prohibited by law. Nothing in this section limits your right to bring claims in a small claims court.
          </p>
        ),
      },
      {
        heading: '11. Changes to These Terms',
        body: (
          <p>
            We may modify these Terms at any time. If we make material changes, we will notify you by email or in-app notice at least 14 days before they take effect. Continued use of Fixit after changes take effect constitutes your agreement to the revised Terms.
          </p>
        ),
      },
    ],
  },

  // ── DATA PROCESSING ADDENDUM ────────────────────────────────────────────────
  dpa: {
    title: 'Data Processing Addendum',
    lastUpdated: 'August 26, 2025',
    intro: 'This Data Processing Addendum ("DPA") forms part of the agreement between Fixit ("Processor") and the customer ("Controller") and governs the processing of personal data on behalf of the Controller in connection with the Fixit service.',
    sections: [
      {
        heading: '1. Definitions',
        body: (
          <p>
            In this DPA: <strong>"Personal Data"</strong> means any information relating to an identified or identifiable natural person; <strong>"Processing"</strong> means any operation performed on Personal Data; <strong>"Data Subject"</strong> means the individual to whom Personal Data relates; <strong>"Applicable Data Protection Law"</strong> means the GDPR, UK GDPR, CCPA, and any other applicable privacy legislation.
          </p>
        ),
      },
      {
        heading: '2. Roles of the Parties',
        body: (
          <p>
            The Customer acts as the <strong>Controller</strong> determining the purposes and means of processing Personal Data submitted through Fixit. Fixit acts as the <strong>Processor</strong>, processing Personal Data solely on the documented instructions of the Controller and for the purpose of providing the agreed services.
          </p>
        ),
      },
      {
        heading: '3. Scope and Purpose of Processing',
        body: (
          <>
            <p>Fixit processes Personal Data for the following purposes only:</p>
            <ul>
              <li>Performing preflight analysis of submitted iOS application files.</li>
              <li>Generating compliance reports and audit histories.</li>
              <li>User authentication and account management.</li>
              <li>Customer support and billing administration.</li>
            </ul>
            <p>We do not process Personal Data for any other purpose without the Controller's explicit written instruction.</p>
          </>
        ),
      },
      {
        heading: '4. Data Subject Categories',
        body: (
          <p>
            The Personal Data processed may relate to: iOS developer account holders, team members granted access to the Fixit workspace, and end-users whose data may be incidentally present in submitted application files (e.g., crash logs or test data). Controllers are responsible for ensuring they have lawful authority to submit any data containing third-party Personal Data.
          </p>
        ),
      },
      {
        heading: '5. Security Measures',
        body: (
          <>
            <p>Fixit implements the following technical and organizational security measures:</p>
            <ul>
              <li>TLS 1.2+ encryption for all data in transit.</li>
              <li>AES-256 encryption for data at rest.</li>
              <li>Role-based access controls and least-privilege principles for internal staff.</li>
              <li>Regular penetration testing and vulnerability assessments.</li>
              <li>Incident detection and response procedures with a 72-hour breach notification commitment.</li>
              <li>Employee security training and confidentiality obligations.</li>
            </ul>
          </>
        ),
      },
      {
        heading: '6. Sub-processors',
        body: (
          <>
            <p>Fixit uses the following categories of sub-processors to deliver its service:</p>
            <ul>
              <li><strong>Cloud Infrastructure:</strong> Hosting, database, and storage providers (e.g., InsForge, Google Cloud Platform).</li>
              <li><strong>Payment Processing:</strong> Stripe, Inc. for secure billing.</li>
              <li><strong>Error Monitoring:</strong> Application performance and error tracking providers.</li>
              <li><strong>Email Delivery:</strong> Transactional email service providers.</li>
            </ul>
            <p>We will provide at least 30 days' notice before engaging any new sub-processor. Controllers have the right to object to new sub-processors within that period.</p>
          </>
        ),
      },
      {
        heading: '7. International Data Transfers',
        body: (
          <p>
            If Personal Data is transferred outside the European Economic Area (EEA) or the United Kingdom, Fixit will ensure such transfers are protected by appropriate safeguards, including Standard Contractual Clauses (SCCs) as approved by the European Commission, or by relying on an adequacy decision. Customers in regulated jurisdictions may request a copy of applicable transfer mechanisms by contacting us.
          </p>
        ),
      },
      {
        heading: '8. Data Subject Requests',
        body: (
          <p>
            Fixit will assist the Controller in fulfilling Data Subject requests (access, deletion, correction, portability) within a reasonable timeframe. Upon receiving a Data Subject request directed to Fixit, we will promptly notify the Controller and cooperate as required.
          </p>
        ),
      },
      {
        heading: '9. Audit Rights',
        body: (
          <p>
            Controllers may request a summary of Fixit's data processing practices and security certifications once per calendar year at no additional cost. Requests for on-site audits will be considered on a case-by-case basis and may be subject to reasonable scheduling and cost arrangements.
          </p>
        ),
      },
      {
        heading: '10. Termination and Deletion',
        body: (
          <p>
            Upon termination of the service agreement, Fixit will, at the Controller's election, delete or return all Personal Data processed under this DPA within 30 days, and will certify such deletion in writing upon request. Backup copies will be purged within 90 days.
          </p>
        ),
      },
    ],
  },

  // ── COOKIE POLICY ───────────────────────────────────────────────────────────
  cookies: {
    title: 'Cookie Policy',
    lastUpdated: 'August 26, 2025',
    intro: 'This Cookie Policy explains what cookies are, which ones Fixit uses, and how you can manage your preferences.',
    sections: [
      {
        heading: '1. What Are Cookies?',
        body: (
          <p>
            Cookies are small text files placed on your device by websites you visit. They are widely used to make websites work efficiently, remember your preferences, and provide information to site owners. Similar technologies such as localStorage, sessionStorage, and pixels serve analogous purposes and are covered by this policy.
          </p>
        ),
      },
      {
        heading: '2. Essential Cookies',
        body: (
          <>
            <p>These cookies are strictly necessary for Fixit to function. You cannot opt out of them while using the service.</p>
            <table>
              <thead><tr><th>Name</th><th>Purpose</th><th>Duration</th></tr></thead>
              <tbody>
                <tr><td><code>auth_session</code></td><td>Keeps you logged in across page loads and browser restarts.</td><td>30 days or session end</td></tr>
                <tr><td><code>csrf_token</code></td><td>Protects against cross-site request forgery attacks.</td><td>Session</td></tr>
                <tr><td><code>cookie_consent</code></td><td>Stores your cookie preference choice.</td><td>12 months</td></tr>
              </tbody>
            </table>
          </>
        ),
      },
      {
        heading: '3. Analytics Cookies',
        body: (
          <>
            <p>With your consent, we use analytics cookies to understand how users navigate Fixit so we can improve the experience. These cookies do not identify you personally.</p>
            <table>
              <thead><tr><th>Name</th><th>Purpose</th><th>Duration</th></tr></thead>
              <tbody>
                <tr><td><code>_fixit_analytics</code></td><td>Tracks page views, feature usage, and session duration in aggregate.</td><td>12 months</td></tr>
                <tr><td><code>_fixit_ref</code></td><td>Captures referral source to understand how users find Fixit.</td><td>30 days</td></tr>
              </tbody>
            </table>
          </>
        ),
      },
      {
        heading: '4. Third-Party Cookies',
        body: (
          <p>
            Fixit may embed content or integrate third-party services (e.g., payment provider iframes, authentication providers) that set their own cookies. These are governed by those providers' privacy and cookie policies. We do not control third-party cookies and recommend reviewing those providers' policies directly.
          </p>
        ),
      },
      {
        heading: '5. Managing Your Cookie Preferences',
        body: (
          <p>
            You can manage your cookie preferences at any time using your browser settings. Most browsers allow you to view, delete, and block cookies. Note that disabling essential cookies will prevent Fixit from functioning correctly. For analytics cookies specifically, you can withdraw consent by updating your preferences in your account settings or via the cookie banner.
          </p>
        ),
      },
      {
        heading: '6. Do Not Track',
        body: (
          <p>
            Some browsers include a "Do Not Track" (DNT) feature that signals websites not to track user activity. Fixit respects DNT signals — when detected, we disable non-essential analytics cookies automatically.
          </p>
        ),
      },
      {
        heading: '7. Updates to This Policy',
        body: (
          <p>
            We may update this Cookie Policy from time to time as our practices or applicable laws change. Any changes will be posted here with an updated "Last Updated" date. Continued use of Fixit constitutes your acceptance of any revised policy.
          </p>
        ),
      },
    ],
  },

  // ── REFUND POLICY ───────────────────────────────────────────────────────────
  refunds: {
    title: 'Refund and Cancellation Policy',
    lastUpdated: 'August 26, 2025',
    intro: 'We want you to be satisfied with Fixit. This policy explains how cancellations and refunds work for our paid subscription plans.',
    sections: [
      {
        heading: '1. Free Plan',
        body: (
          <p>
            The Starter (free) plan has no cost and therefore no refund implications. You can use it indefinitely without any payment.
          </p>
        ),
      },
      {
        heading: '2. Cancellation',
        body: (
          <p>
            You may cancel your paid subscription at any time from your Account Settings page. Cancellation takes effect at the end of your current billing period. You will continue to have full access to your paid plan features until that date, after which your account will revert to the Starter (free) tier. We do not charge cancellation fees.
          </p>
        ),
      },
      {
        heading: '3. Refund Eligibility',
        body: (
          <>
            <p>We offer refunds in the following circumstances:</p>
            <ul>
              <li><strong>New subscribers — 7-day money-back guarantee:</strong> If you subscribed to a paid plan for the first time and are not satisfied, you may request a full refund within 7 calendar days of your first payment.</li>
              <li><strong>Service outage:</strong> If Fixit experiences a verified service outage of more than 24 consecutive hours in any billing month, affected subscribers may request a pro-rata credit for the downtime.</li>
              <li><strong>Billing error:</strong> If you were charged in error (e.g., duplicate charge), we will issue a full refund upon verification.</li>
              <li><strong>Exceptional circumstances:</strong> We review refund requests on a case-by-case basis for situations outside those above. We aim to be fair and reasonable.</li>
            </ul>
          </>
        ),
      },
      {
        heading: '4. Non-Refundable Situations',
        body: (
          <>
            <p>Refunds are generally not issued for:</p>
            <ul>
              <li>Subscription periods already used beyond the 7-day guarantee window.</li>
              <li>Forgetting to cancel before a renewal date.</li>
              <li>Downgrading from a higher plan to a lower plan mid-cycle.</li>
              <li>App Store rejections — Fixit provides analysis guidance, not approval guarantees.</li>
            </ul>
          </>
        ),
      },
      {
        heading: '5. How to Request a Refund',
        body: (
          <p>
            To request a refund, email us at the support address listed below with the subject line "Refund Request" and include your account email, the date of the charge, and a brief reason. We will respond within 2 business days. Approved refunds are returned to the original payment method within 5–10 business days, depending on your bank or card issuer.
          </p>
        ),
      },
      {
        heading: '6. Annual Plans',
        body: (
          <p>
            Annual subscriptions are eligible for the 7-day money-back guarantee from the date of purchase. After that window, annual plans are non-refundable but you may cancel to prevent renewal and retain access for the remainder of the paid year.
          </p>
        ),
      },
      {
        heading: '7. Consumer Rights',
        body: (
          <p>
            Nothing in this policy limits your statutory rights as a consumer under applicable law in your jurisdiction. If local consumer protection law provides you with refund rights that exceed the terms above, those rights apply.
          </p>
        ),
      },
    ],
  },
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const sectionBodyStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  lineHeight: '1.75rem',
  color: '#374151',
};

// ─── Components ──────────────────────────────────────────────────────────────

export const LegalPageView: React.FC<{ page: LegalPage }> = ({ page }) => {
  const content = pages[page];
  return (
    <PublicLayout title={content.title} lastUpdated={content.lastUpdated}>
      <p className="text-sm text-slate-600 leading-7 border-l-4 border-blue-500 pl-4 bg-blue-50/50 py-3 pr-4 rounded-r-xl">
        {content.intro}
      </p>

      <style>{`
        .legal-body ul { list-style: disc; padding-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 0.5rem; }
        .legal-body li { margin-bottom: 0.35rem; }
        .legal-body table { width: 100%; border-collapse: collapse; margin-top: 0.75rem; font-size: 0.8rem; }
        .legal-body th { background: #f1f5f9; text-align: left; padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; font-weight: 700; color: #1e293b; }
        .legal-body td { padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; color: #475569; vertical-align: top; }
        .legal-body code { background: #f1f5f9; padding: 0.1rem 0.4rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.8rem; }
        .legal-body p { margin-bottom: 0.5rem; }
      `}</style>

      {content.sections.map((s) => (
        <section key={s.heading} className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">{s.heading}</h2>
          <div className="legal-body" style={sectionBodyStyle}>
            {s.body}
          </div>
        </section>
      ))}
    </PublicLayout>
  );
};

export const NotFoundPage: React.FC = () => (
  <PublicLayout title="Page not found" lastUpdated="">
    <p className="text-sm text-slate-600">The page you requested does not exist.</p>
    <a href="/" className="mt-6 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
      Go to homepage
    </a>
  </PublicLayout>
);

export const ResetPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [successState, setSuccessState] = useState<'email' | 'password' | null>(null);

  useEffect(() => {
    // Detect token/otp in URL query or hash
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const tokenFromUrl = params.get('otp') || params.get('token') || params.get('code') || hashParams.get('access_token') || hashParams.get('token');
    const emailFromUrl = params.get('email');
    if (tokenFromUrl) setOtp(tokenFromUrl);
    if (emailFromUrl) setEmail(emailFromUrl);
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSuccessState(null);

    if (!otp) {
      setErrorMsg('Please enter the verification code or token sent to your email.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPasswordWithOtp(newPassword, otp);
      setSuccessState('password');
      setSuccessMsg('Your password has been successfully updated. You can now sign in to Fixit.');
    } catch (err: any) {
      console.error('Password reset failed:', err);
      setErrorMsg(err.message || 'Failed to reset password. The code may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSuccessState(null);

    if (!email) {
      setErrorMsg('Please enter your developer account email.');
      return;
    }

    setLoading(true);
    try {
      await authService.sendPasswordReset(email);
      setSuccessState('email');
      setSuccessMsg(`Password reset instructions sent to ${email}. Check your inbox for the reset link or code.`);
    } catch (err: any) {
      console.error('Failed to send reset email:', err);
      setErrorMsg(err.message || 'Could not send reset email. Please verify your address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout title="Reset Your Password" lastUpdated="">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs max-w-lg space-y-6">
        {successMsg ? (
          <div className="space-y-4 text-center py-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {successState === 'password' ? 'Password Updated' : 'Check Your Email'}
            </h3>
            <p className="text-sm text-slate-600">{successMsg}</p>
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-blue-700 transition-colors"
            >
              <span>{successState === 'password' ? 'Launch Fixit' : 'Back to Fixit'}</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        ) : (
          <>
            {errorMsg && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {otp ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-xs text-slate-600">
                  Enter your new password below to complete the account recovery.
                </p>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Verification Code / OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    placeholder="Enter reset code or token"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-mono focus:border-blue-500 focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Minimum 6 characters"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirm new password"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Set New Password</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleSendResetEmail} className="space-y-4">
                <p className="text-xs text-slate-600">
                  Enter your email address and we will send you a verification link and code to securely reset your password.
                </p>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Developer Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="developer@company.com"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Send Reset Code</span>
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setOtp('manual')}
                    className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
                  >
                    Already have a reset code? Enter code manually
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </PublicLayout>
  );
};

const PublicLayout: React.FC<{ title: string; lastUpdated: string; children: React.ReactNode }> = ({ title, lastUpdated, children }) => (
  <main className="mx-auto min-h-screen max-w-4xl px-6 py-10 sm:py-16">
    <header className="flex flex-col gap-6 border-b border-slate-200 pb-8 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <a href="/" className="font-mono text-sm font-bold text-blue-700 hover:text-blue-800">← Fixit</a>
        <h1 className="mt-4 text-3xl font-extrabold text-slate-950 tracking-tight">{title}</h1>
        {lastUpdated && (
          <p className="mt-1 text-xs text-slate-500 font-mono">Last updated: {lastUpdated}</p>
        )}
      </div>

    </header>

    <div className="mt-10 max-w-3xl space-y-8">
      {children}
    </div>

    <footer className="mt-16 border-t pt-6 text-xs text-slate-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <span>© {new Date().getFullYear()} Fixit. All rights reserved.</span>
      {siteConfig.supportEmail ? (
        <span>Questions? <a className="underline text-blue-600 hover:text-blue-800" href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a></span>
      ) : (
        <span>Contact: support email not yet configured.</span>
      )}
    </footer>
  </main>
);
