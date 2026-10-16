import React, { useState } from 'react';
import { Check, Star, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { DashboardState, ProductKey, ScoreItem } from '../types';
import { PROD_INFO, LEVELS } from '../constants';
import {
  computeSecurityScore,
  getNextSecurityStep,
  calculateLevel,
  generateActivitySeries,
  ago,
} from '../utils';
import SlidingTabs from '../SlidingTabs';

interface DashboardSectionProps {
  state: DashboardState;
  onNavigate: (section: string) => void;
  onOpenProduct: (id: ProductKey) => void;
  onOpenBreakdown: () => void;
  onTriggerSecurityStep: (act?: string) => void;
  onToggleOnboard: () => void;
  onChangeRange: (range: 7 | 30) => void;
  onOpenActivityDrawer: () => void;
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({
  state,
  onNavigate,
  onOpenProduct,
  onOpenBreakdown,
  onTriggerSecurityStep,
  onToggleOnboard,
  onChangeRange,
  onOpenActivityDrawer,
}) => {
  const sc = computeSecurityScore(state);
  const st = getNextSecurityStep(state);
  const lv = calculateLevel(state.points);

  // Activity calculation
  const ser14 = generateActivitySeries(14, state.actDate, state.actCount);
  const last7 = ser14.slice(7).reduce((acc, x) => acc + x.v, 0);
  const prev7 = ser14.slice(0, 7).reduce((acc, x) => acc + x.v, 0);
  const pct = prev7 ? Math.round(((last7 - prev7) / prev7) * 100) : 0;

  // Chart data
  const chartSeries = generateActivitySeries(state.range, state.actDate, state.actCount);
  const maxVal = Math.max(...chartSeries.map((x) => x.v), 1);
  const peakIdx = chartSeries.findIndex((x) => x.v === maxVal);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // SVG Ring values
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference * (1 - sc / 100);

  // Visible products sorted by pinned status
  const visibleProductIds = (Object.keys(PROD_INFO) as ProductKey[])
    .filter((id) => state.apps[id] !== false)
    .sort((a, b) => (state.fav[b] ? 1 : 0) - (state.fav[a] ? 1 : 0));

  // Onboarding items
  const onboardItems = [
    { label: 'Verify your email', done: state.user.verified, act: 'verify' },
    { label: 'Link your GitHub account', done: !!state.conn.github, act: 'github' },
    { label: 'Open a product', done: !!state.awarded.prod, act: 'prod' },
    { label: 'Send feedback', done: !!state.awarded.feedback, act: 'feedback' },
  ];
  const completedOnboardCount = onboardItems.filter((i) => i.done).length;
  const allOnboardCompleted = completedOnboardCount === onboardItems.length;

  const currentHoveredDay =
    hoveredBarIndex !== null ? chartSeries[hoveredBarIndex] : chartSeries[chartSeries.length - 1];

  const formatDayLabel = (dTimestamp: number) => {
    const d = new Date(dTimestamp * 864e5);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${dayNames[d.getUTCDay()]} ${d.getUTCDate()} ${monthNames[d.getUTCMonth()]}`;
  };

  const rangeTabs = [
    { id: '7', label: '7 days' },
    { id: '30', label: '30 days' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Security Score + Onboarding */}
      <div className={`grid gap-5 ${state.onboard === 'show' ? 'lg:grid-cols-[1.6fr_1fr]' : 'grid-cols-1'}`}>
        {/* Security Score Banner */}
        <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-[var(--cardsh)]">
          {/* Circular SVG Ring */}
          <div className="relative w-36 h-36 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
              <circle
                cx="64"
                cy="64"
                r={radius}
                fill="none"
                stroke="var(--track)"
                strokeWidth="10"
              />
              <circle
                className="arc draw transition-all duration-700 ease-out"
                cx="64"
                cy="64"
                r={radius}
                fill="none"
                stroke="var(--brand)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference.toFixed(1)}
                strokeDashoffset={strokeOffset.toFixed(1)}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold tracking-tight text-[var(--fg)]">{sc}</span>
              <span className="text-[11px] font-medium text-[var(--mut2)]">out of 100</span>
            </div>
          </div>

          {/* Score Details & Actions */}
          <div className="flex-1 text-center sm:text-left">
            <span className="text-xs font-semibold text-[var(--mut2)] uppercase tracking-wider">
              Security score
            </span>
            <h2 className="text-xl font-bold tracking-tight text-[var(--fg)] mt-1">
              {st ? st.do : 'Your account is fully protected'}
            </h2>
            <p className="text-sm text-[var(--mut)] mt-1.5 mb-4 leading-relaxed">
              {st
                ? `Adds ${st.pts} points. ${st.why}`
                : 'Two-factor, a verified email, a fresh password, few devices, and a backup email are all in place.'}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              {st && (
                <button
                  onClick={() => onTriggerSecurityStep(st.act)}
                  className="px-4 py-2 bg-[var(--brand)] text-white text-sm font-bold rounded-xl hover:opacity-95 shadow-sm transition-all"
                >
                  {st.btn}
                </button>
              )}
              <button
                onClick={onOpenBreakdown}
                className="px-4 py-2 bg-[var(--raised)] border border-[var(--line)] text-sm font-semibold rounded-xl text-[var(--fg)] hover:border-[var(--mut2)] transition-colors"
              >
                See breakdown
              </button>
            </div>
          </div>
        </div>

        {/* Onboarding Getting Started Checklist */}
        {state.onboard === 'show' && (
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-[var(--cardsh)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-base text-[var(--fg)]">Getting started</h3>
                <button
                  onClick={onToggleOnboard}
                  className="w-7 h-7 rounded-lg border border-[var(--line)] flex items-center justify-center text-[var(--mut2)] hover:text-[var(--fg)]"
                  title="Hide checklist"
                >
                  ✕
                </button>
              </div>

              {allOnboardCompleted ? (
                <div className="py-6 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-[var(--ok)]/15 text-[var(--ok)] mx-auto flex items-center justify-center">
                    <Check className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-sm text-[var(--fg)]">Setup complete</p>
                  <p className="text-xs text-[var(--mut2)]">You have tried all the essentials.</p>
                </div>
              ) : (
                <>
                  <div className="h-1.5 w-full bg-[var(--raised)] rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-[var(--brand)] transition-all duration-500 rounded-full"
                      style={{
                        width: `${(completedOnboardCount / onboardItems.length) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-[var(--mut2)] mb-3">
                    {completedOnboardCount} of {onboardItems.length} done
                  </p>
                  <div className="space-y-1.5">
                    {onboardItems.map((item, idx) => (
                      <button
                        key={idx}
                        disabled={item.done}
                        onClick={() => onTriggerSecurityStep(item.act)}
                        className={`w-full flex items-center gap-3 p-2 rounded-xl text-left text-sm transition-colors ${
                          item.done
                            ? 'text-[var(--mut2)] line-through cursor-default'
                            : 'hover:bg-[var(--raised)] text-[var(--fg)] font-medium'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                            item.done
                              ? 'bg-[var(--ok)] border-[var(--ok)] text-white'
                              : 'border-[var(--mut2)]'
                          }`}
                        >
                          {item.done && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span className="truncate">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <button
          onClick={() => onNavigate('security')}
          className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-5 text-left hover:border-[var(--mut2)] transition-all shadow-[var(--cardsh)]"
        >
          <span className="text-xs font-semibold text-[var(--mut2)] uppercase tracking-wider">
            Signed-in devices
          </span>
          <div className="text-3xl font-extrabold tracking-tight text-[var(--fg)] my-1.5">
            {state.sessions.length}
          </div>
          <span className="text-xs text-[var(--mut2)]">
            Last login {ago(state.sessions[0]?.ts || Date.now()).toLowerCase()}
          </span>
        </button>

        <button
          onClick={() => onNavigate('rewards')}
          className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-5 text-left hover:border-[var(--mut2)] transition-all shadow-[var(--cardsh)]"
        >
          <span className="text-xs font-semibold text-[var(--mut2)] uppercase tracking-wider">
            Reward points
          </span>
          <div className="text-3xl font-extrabold tracking-tight text-[var(--fg)] my-1.5">
            {state.points}
          </div>
          <div className="h-1.5 w-full bg-[var(--raised)] rounded-full overflow-hidden mb-1">
            <div
              className="h-full bg-[var(--brand)] transition-all duration-300"
              style={{ width: `${state.points % 100}%` }}
            />
          </div>
          <span className="text-xs text-[var(--mut2)]">{LEVELS[lv]} level</span>
        </button>

        <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-5 shadow-[var(--cardsh)]">
          <span className="text-xs font-semibold text-[var(--mut2)] uppercase tracking-wider">
            Actions in last 7 days
          </span>
          <div className="text-3xl font-extrabold tracking-tight text-[var(--fg)] my-1.5">
            {last7}
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--raised)] text-[var(--fg)]">
            {Math.abs(pct) < 5 ? (
              'Same as last week'
            ) : pct >= 0 ? (
              <>
                <ArrowUpRight className="w-3.5 h-3.5 text-[var(--ok)]" />
                <span className="text-[var(--ok)]">Up {pct}% on last week</span>
              </>
            ) : (
              <>
                <ArrowDownRight className="w-3.5 h-3.5 text-[var(--warn)]" />
                <span className="text-[var(--warn)]">Down {Math.abs(pct)}% on last week</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Connected Products Quick Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-base text-[var(--fg)]">Your products</h3>
          <button
            onClick={() => onNavigate('products')}
            className="text-xs font-bold text-[var(--brandtxt)] hover:underline"
          >
            Manage
          </button>
        </div>

        {visibleProductIds.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {visibleProductIds.map((id) => {
              const p = PROD_INFO[id];
              const isPinned = !!state.fav[id];
              const isLinked = id === 'lidbridge' ? !!state.conn.github : true;
              return (
                <button
                  key={id}
                  onClick={() => onOpenProduct(id)}
                  className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-4 text-left hover:border-[var(--mut2)] transition-all shadow-[var(--cardsh)] relative group"
                >
                  {isPinned && (
                    <span className="absolute top-3.5 right-3.5 text-[var(--brand)]">
                      <Star className="w-4 h-4 fill-current" />
                    </span>
                  )}
                  <div className="font-bold text-sm text-[var(--fg)] mb-2 group-hover:text-[var(--brand)] transition-colors">
                    {p.name}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--mut2)]">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isLinked ? 'bg-[var(--ok)]' : 'bg-[var(--warn)]'
                      }`}
                    />
                    <span>{isLinked ? 'Active' : 'Not linked'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 text-center text-sm text-[var(--mut2)]">
            All products are hidden. Turn them back on in Settings under Dashboard apps.
          </div>
        )}
      </div>

      {/* Activity Bar Chart and Recent Activity Split */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
        {/* Activity Chart Card */}
        <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-[var(--cardsh)]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-base text-[var(--fg)]">Activity</h3>
            {/* SlidingTabs with hover-to-switch for 7 days / 30 days */}
            <SlidingTabs
              tabs={rangeTabs}
              activeId={String(state.range)}
              onChange={(id) => onChangeRange(Number(id) as 7 | 30)}
              hoverEnabled={state.hoverTabs}
              hoverDelay={140}
            />
          </div>

          <p className="text-xs text-[var(--mut2)] mb-4" id="barInfo">
            {formatDayLabel(currentHoveredDay.d)}: {currentHoveredDay.v} actions{' '}
            {currentHoveredDay === chartSeries[chartSeries.length - 1] ? 'today' : ''}
          </p>

          {/* SVG Bar Chart with Hover and Keyboard interaction */}
          <div className="w-full">
            <svg
              className="w-full h-auto"
              viewBox="0 0 460 190"
              role="group"
              aria-label={`Activity last ${state.range} days`}
            >
              {chartSeries.map((x, i) => {
                const slot = 444 / state.range;
                const bw = Math.min(32, slot * 0.65);
                const h = Math.max(6, (x.v / maxVal) * 120);
                const cx = 8 + slot * i + slot / 2;
                const isToday = i === state.range - 1;
                const isHovered = hoveredBarIndex === i;

                return (
                  <g
                    key={i}
                    tabIndex={0}
                    role="button"
                    aria-label={`${formatDayLabel(x.d)}: ${x.v} actions`}
                    className="cursor-pointer outline-none focus:opacity-80"
                    onMouseEnter={() => setHoveredBarIndex(i)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                    onFocus={() => setHoveredBarIndex(i)}
                    onBlur={() => setHoveredBarIndex(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setHoveredBarIndex(i);
                      }
                    }}
                  >
                    {/* Transparent hover hit target */}
                    <rect
                      x={(cx - slot / 2).toFixed(1)}
                      y="0"
                      width={slot.toFixed(1)}
                      height="190"
                      fill="transparent"
                    />
                    {/* Bar */}
                    <rect
                      x={(cx - bw / 2).toFixed(1)}
                      y={(152 - h).toFixed(1)}
                      width={bw.toFixed(1)}
                      height={h.toFixed(1)}
                      rx={Math.min(6, bw / 2).toFixed(1)}
                      fill={
                        isHovered || i === peakIdx
                          ? 'var(--brand)'
                          : 'color-mix(in srgb, var(--mut2) 35%, var(--card))'
                      }
                      className="transition-all duration-150"
                    />
                    {/* Label */}
                    {(state.range === 7 || i % 6 === 0 || isToday) && (
                      <text
                        x={cx.toFixed(1)}
                        y="176"
                        textAnchor="middle"
                        fontSize="12"
                        fontWeight={isToday ? 700 : 500}
                        fill={isToday ? 'var(--fg)' : 'var(--mut2)'}
                      >
                        {state.range === 7 ? 'SMTWTFS'[x.dow] : new Date(x.d * 864e5).getUTCDate()}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Recent Activity Card */}
        <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-[var(--cardsh)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-[var(--fg)]">Recent activity</h3>
              <button
                onClick={onOpenActivityDrawer}
                className="text-xs font-bold text-[var(--brandtxt)] hover:underline"
              >
                View all
              </button>
            </div>
            <div className="divide-y divide-[var(--line)]">
              {state.activity.slice(0, 5).map((act, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-[var(--fg)]">{act.t}</span>
                  <small className="text-xs text-[var(--mut2)] whitespace-nowrap flex-shrink-0">
                    {ago(act.ts)}
                  </small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSection;
