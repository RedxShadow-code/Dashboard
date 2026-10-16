import React, { useState, useEffect } from 'react';
import { Sliders, User, Shield, AppWindow, Database, AlertTriangle, Check, Github, Disc as Discord } from 'lucide-react';
import {
  DashboardState,
  SettingsTab,
  UserProfile,
  ThemeMode,
  LayoutDensity,
  NetworkSim,
  ProductKey,
} from '../types';
import { PROD_INFO, DAY } from '../constants';
import DataExportSection from './DataExportSection';
import SlidingTabs from '../SlidingTabs';

interface SettingsSectionProps {
  state: DashboardState;
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  onUpdateProfile: (profile: Partial<UserProfile>) => Promise<boolean>;
  onChangeAvatarColor: () => void;
  onConnectGithub: () => void;
  onDisconnectGithub: () => void;
  onConnectDiscord: () => void;
  onDisconnectDiscord: () => void;
  onVerifyEmail: () => void;
  onAddBackupEmail: () => void;
  onRemoveBackupEmail: () => void;
  onNavigateToSecurity: () => void;
  onToggleAppVisibility: (prodId: ProductKey) => void;
  onSetTheme: (theme: ThemeMode) => void;
  onPreviewTheme?: (theme: ThemeMode | null) => void;
  onSetDensity: (density: LayoutDensity) => void;
  onSetNetworkSim: (sim: NetworkSim) => void;
  onReloadPage: () => void;
  onTriggerFailNext: () => void;
  onToggleMotion: () => void;
  onToggleOnboardSetting: () => void;
  onToggleHoverTabs: () => void;
  onOpenShortcutsModal: () => void;
  onGenerateExport: (json: string) => void;
  onResetDemoData: () => void;
  onDeleteAccount: () => void;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  state,
  activeTab,
  onTabChange,
  onUpdateProfile,
  onChangeAvatarColor,
  onConnectGithub,
  onDisconnectGithub,
  onConnectDiscord,
  onDisconnectDiscord,
  onVerifyEmail,
  onAddBackupEmail,
  onRemoveBackupEmail,
  onNavigateToSecurity,
  onToggleAppVisibility,
  onSetTheme,
  onPreviewTheme,
  onSetDensity,
  onSetNetworkSim,
  onReloadPage,
  onTriggerFailNext,
  onToggleMotion,
  onToggleOnboardSetting,
  onToggleHoverTabs,
  onOpenShortcutsModal,
  onGenerateExport,
  onResetDemoData,
  onDeleteAccount,
}) => {
  // Profile edit state
  const [display, setDisplay] = useState(state.user.display);
  const [name, setName] = useState(state.user.name);
  const [username, setUsername] = useState(state.user.username);
  const [birth, setBirth] = useState(state.user.birth);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    setDisplay(state.user.display);
    setName(state.user.name);
    setUsername(state.user.username);
    setBirth(state.user.birth);
  }, [state.user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    const dVal = display.trim();
    const nVal = name.trim();
    const uVal = username.trim().toLowerCase();

    if (!dVal || dVal.length > 24) {
      errors.display = 'Enter a display name up to 24 characters.';
    }
    if (nVal.length < 2) {
      errors.name = 'Enter your name.';
    }
    if (!/^[a-z0-9_]{3,20}$/.test(uVal)) {
      errors.username = 'Use 3 to 20 letters, numbers, or underscores.';
    } else if (uVal !== state.user.username) {
      const recentChanges = state.unameChanges.filter((t) => Date.now() - t < 7 * DAY);
      if (recentChanges.length >= 2) {
        errors.username = 'You can change your username twice every 7 days.';
      }
    }

    if (birth) {
      const d = new Date(birth);
      const age = (Date.now() - d.getTime()) / (365.25 * DAY);
      if (isNaN(d.getTime()) || d.getTime() > Date.now()) {
        errors.birth = 'Enter a date in the past.';
      } else if (age < 13) {
        errors.birth = 'You must be at least 13 years old.';
      }
    }

    setProfileErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setProfileSaving(true);
    const ok = await onUpdateProfile({
      display: dVal,
      name: nVal,
      username: uVal,
      birth,
    });
    setProfileSaving(false);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: <User className="w-4 h-4" /> },
    { id: 'identity', label: 'Identity and verification', icon: <Shield className="w-4 h-4" /> },
    { id: 'apps', label: 'Dashboard apps', icon: <AppWindow className="w-4 h-4" /> },
    { id: 'prefs', label: 'Preferences', icon: <Sliders className="w-4 h-4" /> },
    { id: 'export', label: 'Data export', icon: <Database className="w-4 h-4" /> },
    { id: 'danger', label: 'Danger zone', icon: <AlertTriangle className="w-4 h-4" />, isDanger: true },
  ];

  const initial = (state.user.display || 'A').trim().charAt(0).toUpperCase();

  return (
    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8 items-start">
      {/* Settings Navigation SlidingTabs (Vertical on Desktop, Horizontal on Mobile) with Hover-to-Switch */}
      <div className="w-full">
        {/* Desktop Vertical SlidingTabs */}
        <div className="hidden md:block">
          <SlidingTabs
            tabs={tabs}
            activeId={activeTab}
            onChange={(id) => onTabChange(id as SettingsTab)}
            orientation="vertical"
            hoverEnabled={state.hoverTabs}
            hoverDelay={140}
          />
        </div>
        {/* Mobile Horizontal SlidingTabs */}
        <div className="md:hidden">
          <SlidingTabs
            tabs={tabs}
            activeId={activeTab}
            onChange={(id) => onTabChange(id as SettingsTab)}
            orientation="horizontal"
            hoverEnabled={state.hoverTabs}
            hoverDelay={140}
          />
        </div>
      </div>

      {/* Tab Panels */}
      <div className="min-w-0 space-y-6">
        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-[var(--cardsh)]">
              <form onSubmit={handleProfileSubmit} className="space-y-5">
                {/* Avatar with Color Picker Action */}
                <div className="flex items-center gap-4 pb-4 border-b border-[var(--line)]">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-black text-white border-2 border-[var(--brand)] shadow-sm"
                    style={{
                      backgroundColor: state.user.color || 'var(--raised)',
                      color: state.user.color ? '#ffffff' : 'var(--fg)',
                    }}
                  >
                    {initial}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={onChangeAvatarColor}
                      className="px-4 py-2 bg-[var(--raised)] border border-[var(--line)] text-xs font-bold rounded-xl text-[var(--fg)] hover:border-[var(--mut2)] transition-colors"
                    >
                      Change photo
                    </button>
                    <p className="text-xs text-[var(--mut2)] mt-1.5">
                      Select custom avatar theme accent.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--mut2)] mb-1">
                      Display name
                    </label>
                    <input
                      type="text"
                      maxLength={24}
                      value={display}
                      onChange={(e) => setDisplay(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--inbg)] text-[var(--fg)] text-sm focus:border-[var(--brand)] outline-none"
                    />
                    {profileErrors.display && (
                      <p className="text-xs text-[var(--bad)] mt-1">{profileErrors.display}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--mut2)] mb-1">
                      Full name
                    </label>
                    <input
                      type="text"
                      maxLength={40}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--inbg)] text-[var(--fg)] text-sm focus:border-[var(--brand)] outline-none"
                    />
                    {profileErrors.name && (
                      <p className="text-xs text-[var(--bad)] mt-1">{profileErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--mut2)] mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      maxLength={20}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--inbg)] text-[var(--fg)] text-sm focus:border-[var(--brand)] outline-none"
                    />
                    {profileErrors.username && (
                      <p className="text-xs text-[var(--bad)] mt-1">{profileErrors.username}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--mut2)] mb-1">
                      Birth date
                    </label>
                    <input
                      type="date"
                      value={birth}
                      onChange={(e) => setBirth(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--inbg)] text-[var(--fg)] text-sm focus:border-[var(--brand)] outline-none"
                    />
                    {profileErrors.birth && (
                      <p className="text-xs text-[var(--bad)] mt-1">{profileErrors.birth}</p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-5 py-2.5 bg-[var(--brand)] text-white text-sm font-bold rounded-xl hover:opacity-95 shadow-sm transition-all"
                >
                  {profileSaving ? 'Saving...' : 'Save changes'}
                </button>
              </form>
            </div>

            {/* Connected Accounts */}
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-[var(--cardsh)]">
              <h3 className="font-bold text-base text-[var(--fg)] mb-4">Connected accounts</h3>
              <div className="divide-y divide-[var(--line)]">
                <div className="py-3.5 flex items-center justify-between text-sm">
                  <div>
                    <b className="font-semibold text-[var(--fg)] block">GitHub</b>
                    <small className="text-xs text-[var(--mut2)]">
                      {state.conn.github ? `Linked as @${state.conn.github}` : 'Not linked'}
                    </small>
                  </div>
                  {state.conn.github ? (
                    <button
                      onClick={onDisconnectGithub}
                      className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-[var(--line)] text-[var(--fg)] hover:border-[var(--mut2)]"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={onConnectGithub}
                      className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-[var(--brand)] text-white hover:opacity-95"
                    >
                      Connect
                    </button>
                  )}
                </div>

                <div className="py-3.5 flex items-center justify-between text-sm">
                  <div>
                    <b className="font-semibold text-[var(--fg)] block">Discord</b>
                    <small className="text-xs text-[var(--mut2)]">
                      {state.conn.discord ? `Linked as ${state.conn.discord}` : 'Not linked'}
                    </small>
                  </div>
                  {state.conn.discord ? (
                    <button
                      onClick={onDisconnectDiscord}
                      className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-[var(--line)] text-[var(--fg)] hover:border-[var(--mut2)]"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={onConnectDiscord}
                      className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-[var(--brand)] text-white hover:opacity-95"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Identity & Verification Tab */}
        {activeTab === 'identity' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-[var(--cardsh)]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-base text-[var(--fg)]">Primary email</h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    state.user.verified
                      ? 'bg-[var(--ok)]/15 text-[var(--ok)]'
                      : 'bg-[var(--warn)]/15 text-[var(--warn)]'
                  }`}
                >
                  {state.user.verified ? 'Verified' : 'Not verified'}
                </span>
              </div>
              <p className="text-sm font-semibold text-[var(--fg)] mb-4">{state.user.email}</p>
              {state.user.verified ? (
                <p className="text-xs text-[var(--ok)] flex items-center gap-1.5 font-medium">
                  <Check className="w-4 h-4" /> Your email is confirmed.
                </p>
              ) : (
                <button
                  onClick={onVerifyEmail}
                  className="px-4 py-2 bg-[var(--brand)] text-white text-xs font-bold rounded-xl hover:opacity-95 shadow-sm"
                >
                  Verify email
                </button>
              )}
            </div>

            <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-[var(--cardsh)]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-base text-[var(--fg)]">Backup email</h3>
                <span className="text-xs text-[var(--mut2)]">
                  {state.user.backup ? 'Added' : 'Optional'}
                </span>
              </div>
              {state.user.backup ? (
                <div className="flex items-center justify-between py-2 text-sm">
                  <span className="font-medium text-[var(--fg)]">{state.user.backup}</span>
                  <button
                    onClick={onRemoveBackupEmail}
                    className="text-xs font-semibold text-[var(--bad)] hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-xs text-[var(--mut)] mb-4">
                    Helps you regain access if you ever lose your primary mailbox.
                  </p>
                  <button
                    onClick={onAddBackupEmail}
                    className="px-4 py-2 bg-[var(--raised)] border border-[var(--line)] text-xs font-bold rounded-xl text-[var(--fg)] hover:border-[var(--mut2)]"
                  >
                    Add backup email
                  </button>
                </>
              )}
            </div>

            <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-[var(--cardsh)] flex items-center justify-between">
              <div>
                <b className="font-bold text-sm text-[var(--fg)] block">Two-factor authentication</b>
                <small className="text-xs text-[var(--mut2)]">
                  {state.twofa ? 'Enabled' : 'Disabled'}
                </small>
              </div>
              <button
                onClick={onNavigateToSecurity}
                className="px-4 py-2 bg-[var(--raised)] border border-[var(--line)] text-xs font-bold rounded-xl text-[var(--fg)] hover:border-[var(--mut2)]"
              >
                Manage in Security
              </button>
            </div>
          </div>
        )}

        {/* Dashboard Apps Tab */}
        {activeTab === 'apps' && (
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-[var(--cardsh)] animate-fade-in">
            <h3 className="font-bold text-base text-[var(--fg)] mb-1">Dashboard apps</h3>
            <p className="text-xs text-[var(--mut2)] mb-5">
              Choose which products are visible on your Overview page.
            </p>

            <div className="divide-y divide-[var(--line)]">
              {(Object.keys(PROD_INFO) as ProductKey[]).map((id) => {
                const p = PROD_INFO[id];
                const isVisible = state.apps[id] !== false;

                return (
                  <div key={id} className="py-3.5 flex items-center justify-between text-sm">
                    <div>
                      <b className="font-semibold text-[var(--fg)] block">{p.name}</b>
                      <small className="text-xs text-[var(--mut2)]">{p.desc}</small>
                    </div>

                    <button
                      onClick={() => onToggleAppVisibility(id)}
                      role="switch"
                      aria-checked={isVisible}
                      className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                        isVisible ? 'bg-[var(--brand)]' : 'bg-[var(--tgoff)]'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          isVisible ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'prefs' && (
          <div className="space-y-6 animate-fade-in">
            {/* Appearance */}
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-[var(--cardsh)]">
              <h3 className="font-bold text-base text-[var(--fg)] mb-2">Appearance</h3>
              {state.hoverTabs && (
                <p className="text-xs text-[var(--mut2)] mb-4">
                  Hover over a theme to preview it live. Click to keep it.
                </p>
              )}
              <div className="flex gap-2">
                {(['dark', 'light', 'system'] as ThemeMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => onSetTheme(mode)}
                    onMouseEnter={() => state.hoverTabs && onPreviewTheme?.(mode)}
                    onMouseLeave={() => state.hoverTabs && onPreviewTheme?.(null)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all capitalize ${
                      state.theme === mode
                        ? 'bg-[var(--card)] border-[var(--brand)] text-[var(--fg)] font-bold shadow-xs'
                        : 'border-[var(--line)] text-[var(--mut)] hover:border-[var(--mut2)]'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Layout Density */}
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-[var(--cardsh)]">
              <h3 className="font-bold text-base text-[var(--fg)] mb-3">Layout density</h3>
              <div className="flex gap-2">
                {(['comfortable', 'compact'] as LayoutDensity[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => onSetDensity(d)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all capitalize ${
                      state.density === d
                        ? 'bg-[var(--card)] border-[var(--brand)] text-[var(--fg)] font-bold shadow-xs'
                        : 'border-[var(--line)] text-[var(--mut)] hover:border-[var(--mut2)]'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Test Loading & Error States */}
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-[var(--cardsh)]">
              <h3 className="font-bold text-base text-[var(--fg)] mb-1">
                Test loading and error states
              </h3>
              <p className="text-xs text-[var(--mut2)] mb-4">
                Designed for review. Pages display an animated skeleton upon first load.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {(['normal', 'slow', 'offline'] as NetworkSim[]).map((sim) => (
                  <button
                    key={sim}
                    onClick={() => onSetNetworkSim(sim)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border capitalize transition-colors ${
                      state.density ? 'border-[var(--line)] text-[var(--fg)] hover:border-[var(--mut2)]' : ''
                    }`}
                  >
                    {sim}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onReloadPage}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-[var(--line)] text-[var(--fg)] hover:border-[var(--mut2)]"
                >
                  Reload this page
                </button>
                <button
                  onClick={onTriggerFailNext}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-[var(--line)] text-[var(--fg)] hover:border-[var(--mut2)]"
                >
                  Show error state
                </button>
              </div>
            </div>

            {/* Extras Toggles */}
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-[var(--cardsh)] divide-y divide-[var(--line)]">
              <h3 className="font-bold text-base text-[var(--fg)] pb-3">Extras</h3>

              <div className="py-3.5 flex items-center justify-between text-sm">
                <div>
                  <b className="font-semibold text-[var(--fg)] block">Animations</b>
                  <small className="text-xs text-[var(--mut2)]">
                    Score ring and micro-transitions
                  </small>
                </div>
                <button
                  onClick={onToggleMotion}
                  role="switch"
                  aria-checked={state.motion}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                    state.motion ? 'bg-[var(--brand)]' : 'bg-[var(--tgoff)]'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      state.motion ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="py-3.5 flex items-center justify-between text-sm">
                <div>
                  <b className="font-semibold text-[var(--fg)] block">Setup checklist</b>
                  <small className="text-xs text-[var(--mut2)]">
                    Show Getting started on Overview
                  </small>
                </div>
                <button
                  onClick={onToggleOnboardSetting}
                  role="switch"
                  aria-checked={state.onboard === 'show'}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                    state.onboard === 'show' ? 'bg-[var(--brand)]' : 'bg-[var(--tgoff)]'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      state.onboard === 'show' ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="py-3.5 flex items-center justify-between text-sm">
                <div>
                  <b className="font-semibold text-[var(--fg)] block">Hover shortcuts</b>
                  <small className="text-xs text-[var(--mut2)]">
                    Switch tabs and preview themes when the mouse rests on them
                  </small>
                </div>
                <button
                  onClick={onToggleHoverTabs}
                  role="switch"
                  aria-checked={state.hoverTabs}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                    state.hoverTabs ? 'bg-[var(--brand)]' : 'bg-[var(--tgoff)]'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      state.hoverTabs ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-3.5 flex items-center justify-between text-sm">
                <div>
                  <b className="font-semibold text-[var(--fg)] block">Keyboard shortcuts</b>
                  <small className="text-xs text-[var(--mut2)]">Navigate without the mouse</small>
                </div>
                <button
                  onClick={onOpenShortcutsModal}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl border border-[var(--line)] text-[var(--fg)] hover:border-[var(--mut2)]"
                >
                  View shortcuts
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Data Export Tab */}
        {activeTab === 'export' && (
          <div className="animate-fade-in">
            <DataExportSection state={state} onGenerateExport={onGenerateExport} />
          </div>
        )}

        {/* Danger Zone Tab */}
        {activeTab === 'danger' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-[var(--cardsh)]">
              <h3 className="font-bold text-base text-[var(--fg)] mb-2">Reset demo data</h3>
              <p className="text-xs text-[var(--mut2)] mb-4">
                Restore all sample data and settings to original state.
              </p>
              <button
                onClick={onResetDemoData}
                className="px-4 py-2 bg-[var(--raised)] border border-[var(--line)] text-xs font-bold rounded-xl text-[var(--fg)] hover:border-[var(--mut2)] transition-colors"
              >
                Reset demo data
              </button>
            </div>

            <div className="bg-[var(--card)] border border-[var(--bad)]/40 rounded-2xl p-6 shadow-[var(--cardsh)]">
              <h3 className="font-bold text-base text-[var(--bad)] mb-2">Delete account</h3>
              <p className="text-xs text-[var(--mut2)] mb-4">
                This removes your profile, tickets, and activity. You will be prompted to enter your
                username to confirm.
              </p>
              <button
                onClick={onDeleteAccount}
                className="px-4 py-2 bg-[var(--bad)] text-white text-xs font-bold rounded-xl hover:opacity-95 shadow-sm transition-all"
              >
                Delete account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsSection;
