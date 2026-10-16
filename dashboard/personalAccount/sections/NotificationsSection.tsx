import React, { useState, useEffect } from 'react';
import { Bell, ShieldAlert, Sparkles, Megaphone, X, VolumeX } from 'lucide-react';
import {
  DashboardState,
  NotifTab,
  NotificationType,
  ProductKey,
  AppNotification,
} from '../types';
import { PROD_INFO, HR } from '../constants';
import { ago } from '../utils';
import SlidingTabs from '../SlidingTabs';

interface NotificationsSectionProps {
  state: DashboardState;
  activeTab: NotifTab;
  onTabChange: (tab: NotifTab) => void;
  onToggleRead: (id: number) => void;
  onDismiss: (id: number) => void;
  onMarkAllRead: () => void;
  onToggleEmailPref: (key: keyof DashboardState['prefs']) => void;
  onToggleBrowserAlerts: () => void;
  browserAlertsLockTime: number;
  onToggleProductChannel: (prodId: ProductKey, channel: 'email' | 'inapp' | 'browser') => void;
  onChangeProductMute: (prodId: ProductKey, hours: number) => void;
  onSendProductTest: (prodId: ProductKey) => void;
  onResetProductPrefs: () => void;
}

export const NotificationsSection: React.FC<NotificationsSectionProps> = ({
  state,
  activeTab,
  onTabChange,
  onToggleRead,
  onDismiss,
  onMarkAllRead,
  onToggleEmailPref,
  onToggleBrowserAlerts,
  browserAlertsLockTime,
  onToggleProductChannel,
  onChangeProductMute,
  onSendProductTest,
  onResetProductPrefs,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [browserLockCountdown, setBrowserLockCountdown] = useState(0);

  useEffect(() => {
    if (!browserAlertsLockTime) {
      setBrowserLockCountdown(0);
      return;
    }
    const updateCountdown = () => {
      const left = Math.ceil((browserAlertsLockTime - Date.now()) / 1000);
      if (left <= 0) {
        setBrowserLockCountdown(0);
      } else {
        setBrowserLockCountdown(left);
      }
    };
    updateCountdown();
    const iv = setInterval(updateCountdown, 1000);
    return () => clearInterval(iv);
  }, [browserAlertsLockTime]);

  const unreadCount = state.notifs.filter((n) => !n.read).length;
  const filteredNotifs = state.notifs.filter(
    (n) => filterType === 'all' || n.type === filterType
  );

  const getNotifIcon = (type: NotificationType) => {
    switch (type) {
      case 'security':
        return <ShieldAlert className="w-4 h-4 text-[var(--bad)]" />;
      case 'update':
        return <Sparkles className="w-4 h-4 text-[var(--ok)]" />;
      case 'announce':
        return <Megaphone className="w-4 h-4 text-[var(--brand)]" />;
      default:
        return <Bell className="w-4 h-4 text-[var(--fg)]" />;
    }
  };

  // Group notifications by date (Today, Yesterday, Earlier)
  const groupLabel = (ts: number) => {
    const d0 = new Date();
    d0.setHours(0, 0, 0, 0);
    if (ts >= d0.getTime()) return 'Today';
    if (ts >= d0.getTime() - 864e5) return 'Yesterday';
    return 'Earlier';
  };

  const isMuted = (id: ProductKey) => {
    const m = state.pp[id]?.mute;
    return m === -1 || m > Date.now();
  };

  const formatMuteTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const mainTabs = [
    { id: 'inbox', label: 'Inbox', badge: unreadCount > 0 ? unreadCount : undefined },
    { id: 'prefs', label: 'Preferences' },
  ];

  const filterTabs = [
    { id: 'all', label: `All (${state.notifs.length})` },
    {
      id: 'security',
      label: `Security (${state.notifs.filter((n) => n.type === 'security').length})`,
    },
    {
      id: 'update',
      label: `Updates (${state.notifs.filter((n) => n.type === 'update').length})`,
    },
    {
      id: 'announce',
      label: `Announcements (${state.notifs.filter((n) => n.type === 'announce').length})`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Sliding Tabs with Hover-to-Switch */}
      <SlidingTabs
        tabs={mainTabs}
        activeId={activeTab}
        onChange={(id) => onTabChange(id as NotifTab)}
        hoverEnabled={state.hoverTabs}
        hoverDelay={140}
      />

      {/* Inbox View */}
      {activeTab === 'inbox' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Filter Tabs with Hover-to-Switch */}
            <SlidingTabs
              tabs={filterTabs}
              activeId={filterType}
              onChange={(id) => setFilterType(id)}
              hoverEnabled={state.hoverTabs}
              hoverDelay={140}
            />

            <button
              onClick={onMarkAllRead}
              disabled={unreadCount === 0}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-[var(--line)] text-[var(--fg)] hover:border-[var(--mut2)] disabled:opacity-50"
            >
              Mark all read
            </button>
          </div>

          <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-4 sm:p-6 shadow-[var(--cardsh)] divide-y divide-[var(--line)]">
            {filteredNotifs.length ? (
              filteredNotifs.map((notif, idx) => {
                const prev = filteredNotifs[idx - 1];
                const showGroupHeader = !prev || groupLabel(prev.ts) !== groupLabel(notif.ts);

                return (
                  <React.Fragment key={notif.id}>
                    {showGroupHeader && (
                      <div className="py-2.5 text-xs font-bold text-[var(--mut2)] uppercase tracking-wider">
                        {groupLabel(notif.ts)}
                      </div>
                    )}
                    <div
                      className={`py-3.5 flex items-start gap-3.5 group relative transition-colors ${
                        !notif.read ? 'font-medium' : 'opacity-85'
                      }`}
                    >
                      {/* Unread dot */}
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-[var(--brand)] absolute -left-2 top-6" />
                      )}

                      {/* Icon circle */}
                      <div className="w-9 h-9 rounded-full bg-[var(--raised)] flex items-center justify-center flex-shrink-0 mt-0.5">
                        {getNotifIcon(notif.type)}
                      </div>

                      {/* Content trigger button */}
                      <button
                        onClick={() => onToggleRead(notif.id)}
                        className="flex-1 text-left min-w-0"
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <b className="font-bold text-sm text-[var(--fg)] truncate block">
                            {notif.title}
                          </b>
                          <span className="text-xs text-[var(--mut2)] whitespace-nowrap">
                            {ago(notif.ts)}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--mut)] mt-0.5 leading-relaxed">
                          {notif.text}
                        </p>
                        {notif.prod && PROD_INFO[notif.prod as ProductKey] && (
                          <div className="text-[11px] text-[var(--mut2)] mt-1 font-semibold">
                            {PROD_INFO[notif.prod as ProductKey].name}
                            {notif.email && ' (emailed)'}
                          </div>
                        )}
                      </button>

                      {/* Dismiss button */}
                      <button
                        onClick={() => onDismiss(notif.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--mut2)] hover:text-[var(--bad)] hover:bg-[var(--raised)] flex-shrink-0 transition-colors"
                        title="Dismiss"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </React.Fragment>
                );
              })
            ) : (
              <div className="py-12 text-center text-sm text-[var(--mut2)]">
                No notifications found in this view.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preferences View */}
      {activeTab === 'prefs' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email Preferences */}
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-[var(--cardsh)]">
              <h3 className="font-bold text-base text-[var(--fg)] mb-4">Email alerts by type</h3>
              <div className="divide-y divide-[var(--line)]">
                {[
                  { k: 'login' as const, l: 'Login alerts' },
                  { k: 'password' as const, l: 'Password changes' },
                  { k: 'devices' as const, l: 'New devices' },
                  { k: 'product' as const, l: 'Product updates' },
                  { k: 'offers' as const, l: 'Offers' },
                ].map(({ k, l }) => (
                  <div key={k} className="py-3 flex items-center justify-between text-sm">
                    <span className="font-medium text-[var(--fg)]">{l}</span>
                    <button
                      onClick={() => onToggleEmailPref(k)}
                      role="switch"
                      aria-checked={state.prefs[k]}
                      className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                        state.prefs[k] ? 'bg-[var(--brand)]' : 'bg-[var(--tgoff)]'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          state.prefs[k] ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Browser Alerts Card */}
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-[var(--cardsh)] flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base text-[var(--fg)] mb-2">Browser alerts</h3>
                <p className="text-sm text-[var(--mut)] mb-6">
                  Show a native pop-up notification when a new alert arrives in the app.
                </p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={onToggleBrowserAlerts}
                    disabled={browserLockCountdown > 0}
                    role="switch"
                    aria-checked={state.browser}
                    className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 disabled:opacity-50 ${
                      state.browser ? 'bg-[var(--brand)]' : 'bg-[var(--tgoff)]'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        state.browser ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className="text-sm font-bold text-[var(--fg)]">
                    {state.browser ? 'On' : 'Off'}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--line)]">
                {browserLockCountdown > 0 ? (
                  <p className="text-xs text-[var(--warn)] font-medium">
                    Too many changes. Try again in {browserLockCountdown}s.
                  </p>
                ) : (
                  <p className="text-xs text-[var(--mut2)]">
                    Rate limited to 3 toggles every 20 seconds.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Product Notification Delivery Preferences */}
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-[var(--cardsh)]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-base text-[var(--fg)]">By product</h3>
              <button
                onClick={onResetProductPrefs}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-[var(--line)] text-[var(--fg)] hover:border-[var(--mut2)]"
              >
                Reset to defaults
              </button>
            </div>
            <p className="text-xs text-[var(--mut2)] mb-6">
              Choose how each product reaches you. Browser delivery also requires Browser alerts
              turned on above.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.keys(PROD_INFO) as ProductKey[]).map((id) => {
                const p = PROD_INFO[id];
                const pp = state.pp[id];
                const muted = isMuted(id);

                return (
                  <div
                    key={id}
                    className="p-4 rounded-xl border border-[var(--line)] bg-[var(--panel)] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <b className="font-bold text-sm text-[var(--fg)]">{p.name}</b>
                      {muted && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[var(--warn)]/15 text-[var(--warn)] flex items-center gap-1">
                          <VolumeX className="w-3 h-3" /> Muted
                        </span>
                      )}
                    </div>

                    {muted && pp.mute > 0 && (
                      <p className="text-[11px] text-[var(--mut2)]">
                        Muted until {formatMuteTime(pp.mute)}
                      </p>
                    )}

                    <div className="grid grid-cols-3 gap-2 py-1">
                      {(['email', 'inapp', 'browser'] as const).map((ch) => (
                        <div
                          key={ch}
                          className="flex flex-col items-start gap-1 p-2 rounded-lg border border-[var(--line)] bg-[var(--card)] text-xs font-semibold text-[var(--fg)]"
                        >
                          <span className="capitalize">{ch === 'inapp' ? 'In-app' : ch}</span>
                          <button
                            onClick={() => onToggleProductChannel(id, ch)}
                            role="switch"
                            aria-checked={pp[ch]}
                            className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                              pp[ch] ? 'bg-[var(--brand)]' : 'bg-[var(--tgoff)]'
                            }`}
                          >
                            <span
                              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                pp[ch] ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-[var(--line)]">
                      <label className="text-xs text-[var(--mut2)] font-semibold">Mute</label>
                      <select
                        value={pp.mute === 0 ? '0' : pp.mute === -1 ? '-1' : 'timed'}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '0') onChangeProductMute(id, 0);
                          else if (val === '-1') onChangeProductMute(id, -1);
                          else onChangeProductMute(id, Number(val));
                        }}
                        className="px-2.5 py-1 text-xs rounded-lg border border-[var(--line)] bg-[var(--card)] text-[var(--fg)] outline-none"
                      >
                        <option value="0">Not muted</option>
                        <option value="1">1 hour</option>
                        <option value="8">8 hours</option>
                        <option value="24">1 day</option>
                        <option value="-1">Until I turn it on</option>
                      </select>

                      <button
                        onClick={() => onSendProductTest(id)}
                        className="ml-auto px-3 py-1 bg-[var(--raised)] border border-[var(--line)] text-xs font-bold rounded-lg text-[var(--fg)] hover:border-[var(--mut2)]"
                      >
                        Send test
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsSection;
