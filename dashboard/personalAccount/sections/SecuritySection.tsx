import React, { useState } from 'react';
import { Check, Minus, ShieldCheck, Mail, KeyRound, Monitor, Smartphone, Laptop } from 'lucide-react';
import { DashboardState, SecurityTab, ScoreItem } from '../types';
import { scoreItems, ago } from '../utils';
import SlidingTabs from '../SlidingTabs';

interface SecuritySectionProps {
  state: DashboardState;
  activeTab: SecurityTab;
  onTabChange: (tab: SecurityTab) => void;
  onOpenTwoFactorModal: () => void;
  onDisableTwoFactor: () => void;
  onOpenRecoveryCodesModal: () => void;
  onOpenVerifyEmailModal: () => void;
  onOpenBreakdownModal: () => void;
  onSignOutSession: (id: number) => void;
  onSignOutOthers: () => void;
  onUpdatePassword: (cur: string, nw: string, code: string) => Promise<boolean>;
  onSendPasswordCode: () => void;
  onTriggerSecurityAction: (act?: string) => void;
  drafts?: Record<string, string>;
  onUpdateDraft?: (key: string, val: string) => void;
}

export const SecuritySection: React.FC<SecuritySectionProps> = ({
  state,
  activeTab,
  onTabChange,
  onOpenTwoFactorModal,
  onDisableTwoFactor,
  onOpenRecoveryCodesModal,
  onOpenVerifyEmailModal,
  onOpenBreakdownModal,
  onSignOutSession,
  onSignOutOthers,
  onUpdatePassword,
  onSendPasswordCode,
  onTriggerSecurityAction,
  drafts = {},
  onUpdateDraft,
}) => {
  // Password form states with draft support
  const currentPw = drafts['pw.cur'] || '';
  const newPw = drafts['pw.new'] || '';
  const pwCode = drafts['pw.code'] || '';
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [pwSubmitting, setPwSubmitting] = useState(false);

  const calculatePwStrength = (p: string) => {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p) || p.length >= 12) s++;
    return p.length < 8 ? Math.min(s, 1) : s;
  };

  const strength = calculatePwStrength(newPw);
  const strengthLabels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!currentPw) errors.cur = 'Enter your current password.';
    if (newPw.length < 8) errors.nw = 'Use at least 8 characters.';
    else if (strength < 2) errors.nw = 'Add upper and lower case letters or a number.';
    else if (newPw === currentPw) errors.nw = 'Choose a password you have not used just now.';
    if (!state.pwCode) errors.code = 'Send a verification code first.';
    else if (pwCode !== state.pwCode) errors.code = 'That code does not match.';

    setPwErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setPwSubmitting(true);
    const ok = await onUpdatePassword(currentPw, newPw, pwCode);
    setPwSubmitting(false);
    if (ok) {
      onUpdateDraft?.('pw.cur', '');
      onUpdateDraft?.('pw.new', '');
      onUpdateDraft?.('pw.code', '');
      setPwErrors({});
    }
  };

  const getDeviceIcon = (name: string) => {
    if (name.toLowerCase().includes('phone') || name.toLowerCase().includes('android')) {
      return <Smartphone className="w-5 h-5 text-[var(--mut2)]" />;
    }
    if (name.toLowerCase().includes('mac') || name.toLowerCase().includes('laptop')) {
      return <Laptop className="w-5 h-5 text-[var(--mut2)]" />;
    }
    return <Monitor className="w-5 h-5 text-[var(--mut2)]" />;
  };

  const items = scoreItems(state);

  const securityTabs = [
    { id: 'account', label: 'Account' },
    { id: 'password', label: 'Password' },
    { id: 'history', label: 'Login history' },
  ];

  return (
    <div className="space-y-6">
      {/* Sliding Tabs with Hover-to-switch and animated indicator */}
      <SlidingTabs
        tabs={securityTabs}
        activeId={activeTab}
        onChange={(id) => onTabChange(id as SecurityTab)}
        hoverEnabled={state.hoverTabs}
        hoverDelay={140}
      />

      {/* Account Tab Content */}
      {activeTab === 'account' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 2FA Card */}
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-[var(--cardsh)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-base text-[var(--fg)]">Two-factor authentication</h3>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      state.twofa ? 'bg-[var(--ok)]/15 text-[var(--ok)]' : 'bg-[var(--warn)]/15 text-[var(--warn)]'
                    }`}
                  >
                    <i className="w-1.5 h-1.5 rounded-full bg-current" />
                    {state.twofa ? 'Enabled' : 'Off'}
                  </span>
                </div>
                <p className="text-sm text-[var(--mut)]">
                  {state.twofa
                    ? 'Your authenticator app protects your sign-ins.'
                    : 'Add a second check when you sign in.'}
                </p>
                <p className="text-xs text-[var(--mut2)] mt-1 mb-5">
                  {state.twofa
                    ? `${state.codes.length} recovery codes left`
                    : 'Turn it on to generate recovery codes'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-4 border-t border-[var(--line)]">
                {state.twofa ? (
                  <>
                    <button
                      onClick={onOpenRecoveryCodesModal}
                      className="px-4 py-2 bg-[var(--raised)] border border-[var(--line)] text-sm font-semibold rounded-xl text-[var(--fg)] hover:border-[var(--mut2)]"
                    >
                      View recovery codes
                    </button>
                    <button
                      onClick={onDisableTwoFactor}
                      className="px-4 py-2 text-sm font-semibold text-[var(--bad)] hover:bg-[var(--bad)]/10 rounded-xl"
                    >
                      Disable
                    </button>
                  </>
                ) : (
                  <button
                    onClick={onOpenTwoFactorModal}
                    className="px-4 py-2 bg-[var(--brand)] text-white text-sm font-bold rounded-xl hover:opacity-95 shadow-sm"
                  >
                    Turn on two-factor
                  </button>
                )}
              </div>
            </div>

            {/* Email Verification Card */}
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-[var(--cardsh)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-base text-[var(--fg)]">Email verification</h3>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      state.user.verified
                        ? 'bg-[var(--ok)]/15 text-[var(--ok)]'
                        : 'bg-[var(--warn)]/15 text-[var(--warn)]'
                    }`}
                  >
                    <i className="w-1.5 h-1.5 rounded-full bg-current" />
                    {state.user.verified ? 'Verified' : 'Not verified'}
                  </span>
                </div>
                <p className="text-sm font-semibold text-[var(--fg)]">{state.user.email}</p>
                <p className="text-xs text-[var(--mut2)] mt-1 mb-5">
                  {state.user.verified
                    ? 'Your email is confirmed and ready for account recovery.'
                    : 'Confirm your email to recover your account if you ever lose access.'}
                </p>
              </div>

              <div className="pt-4 border-t border-[var(--line)]">
                {state.user.verified ? (
                  <span className="text-xs font-semibold text-[var(--ok)] flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> Ready & active
                  </span>
                ) : (
                  <button
                    onClick={onOpenVerifyEmailModal}
                    className="px-4 py-2 bg-[var(--brand)] text-white text-sm font-bold rounded-xl hover:opacity-95 shadow-sm"
                  >
                    Verify email
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Score Breakdown Card */}
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-[var(--cardsh)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-[var(--fg)]">Score breakdown</h3>
              <button
                onClick={onOpenBreakdownModal}
                className="text-xs font-bold text-[var(--brandtxt)] hover:underline"
              >
                Open as list
              </button>
            </div>
            <div className="divide-y divide-[var(--line)]">
              {items.map((item, idx) => (
                <div key={idx} className="py-3.5 flex flex-wrap items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span className={item.on ? 'text-[var(--ok)]' : 'text-[var(--mut2)]'}>
                      {item.on ? <Check className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                    </span>
                    <div>
                      <b className="font-semibold text-[var(--fg)] block">{item.l}</b>
                      <small className="text-xs text-[var(--mut2)]">{item.on ? 'Done' : item.why}</small>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-auto">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        item.on ? 'bg-[var(--ok)]/15 text-[var(--ok)]' : 'bg-[var(--raised)] text-[var(--mut2)]'
                      }`}
                    >
                      {item.on ? `+${item.pts} pts` : `${item.pts} pts`}
                    </span>
                    {!item.on && item.act && (
                      <button
                        onClick={() => onTriggerSecurityAction(item.act)}
                        className="px-3 py-1 bg-[var(--raised)] border border-[var(--line)] text-xs font-bold rounded-lg text-[var(--fg)] hover:border-[var(--mut2)]"
                      >
                        {item.cta}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Password Tab Content */}
      {activeTab === 'password' && (
        <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 max-w-lg shadow-[var(--cardsh)] animate-fade-in">
          <h3 className="font-bold text-base text-[var(--fg)] mb-1">Change password</h3>
          <p className="text-xs text-[var(--mut2)] mb-5">
            Last changed {ago(state.pwChanged).toLowerCase()}
          </p>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--mut2)] mb-1">
                Current password
              </label>
              <input
                type="password"
                value={currentPw}
                onChange={(e) => onUpdateDraft?.('pw.cur', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--inbg)] text-[var(--fg)] text-sm focus:border-[var(--brand)] outline-none"
                placeholder="Enter current password"
              />
              {pwErrors.cur && <p className="text-xs text-[var(--bad)] mt-1">{pwErrors.cur}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--mut2)] mb-1">
                New password
              </label>
              <input
                type="password"
                value={newPw}
                onChange={(e) => onUpdateDraft?.('pw.new', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--inbg)] text-[var(--fg)] text-sm focus:border-[var(--brand)] outline-none"
                placeholder="At least 8 characters"
              />
              {/* Strength Meter */}
              <div className="flex gap-1.5 mt-2">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      step <= strength
                        ? strength >= 3
                          ? 'bg-[var(--ok)]'
                          : strength === 2
                          ? 'bg-[var(--warn)]'
                          : 'bg-[var(--bad)]'
                        : 'bg-[var(--line)]'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-[var(--mut2)] block mt-1">
                {newPw
                  ? strengthLabels[strength]
                  : 'Use upper and lower case, a number, and 8 or more characters'}
              </span>
              {pwErrors.nw && <p className="text-xs text-[var(--bad)] mt-1">{pwErrors.nw}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--mut2)] mb-1">
                Verification code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={pwCode}
                  onChange={(e) => onUpdateDraft?.('pw.code', e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--inbg)] text-[var(--fg)] text-sm focus:border-[var(--brand)] outline-none font-mono"
                  placeholder="6 digits"
                />
                <button
                  type="button"
                  onClick={onSendPasswordCode}
                  className="px-4 py-2.5 bg-[var(--raised)] border border-[var(--line)] text-sm font-semibold rounded-xl text-[var(--fg)] hover:border-[var(--mut2)]"
                >
                  Send code
                </button>
              </div>
              {pwErrors.code && <p className="text-xs text-[var(--bad)] mt-1">{pwErrors.code}</p>}
            </div>

            <button
              type="submit"
              disabled={pwSubmitting}
              className="mt-2 w-full py-2.5 bg-[var(--brand)] text-white text-sm font-bold rounded-xl hover:opacity-95 shadow-sm transition-all"
            >
              {pwSubmitting ? 'Updating...' : 'Update password'}
            </button>
          </form>
        </div>
      )}

      {/* Login History Tab Content */}
      {activeTab === 'history' && (
        <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-[var(--cardsh)] animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-[var(--fg)]">Login history</h3>
            <button
              onClick={onSignOutOthers}
              disabled={state.sessions.length < 2}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-[var(--line)] text-[var(--fg)] hover:border-[var(--mut2)] disabled:opacity-50"
            >
              Sign out other devices
            </button>
          </div>

          <div className="divide-y divide-[var(--line)]">
            {state.sessions.map((session) => (
              <div key={session.id} className="py-3.5 flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-3">
                  {getDeviceIcon(session.device)}
                  <div>
                    <b className="font-semibold text-[var(--fg)] block">{session.device}</b>
                    <small className="text-xs text-[var(--mut2)]">
                      {session.cur ? 'Active now' : ago(session.ts)} • {session.location || 'Unknown'}
                    </small>
                  </div>
                </div>

                {session.cur ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--ok)]/15 text-[var(--ok)]">
                    This device
                  </span>
                ) : (
                  <button
                    onClick={() => onSignOutSession(session.id)}
                    className="px-3 py-1 text-xs font-semibold rounded-lg text-[var(--bad)] hover:bg-[var(--bad)]/10"
                  >
                    Sign out
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SecuritySection;
