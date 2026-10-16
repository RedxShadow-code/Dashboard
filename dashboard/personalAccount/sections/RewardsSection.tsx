import React from 'react';
import { Star, Lock, Award, Flame } from 'lucide-react';
import { DashboardState } from '../types';
import { LEVELS } from '../constants';
import { calculateLevel, dayKey } from '../utils';

interface RewardsSectionProps {
  state: DashboardState;
  onDailyCheckin: () => void;
  onTriggerEarnAction: (actionKey: string) => void;
}

export const RewardsSection: React.FC<RewardsSectionProps> = ({
  state,
  onDailyCheckin,
  onTriggerEarnAction,
}) => {
  const lv = calculateLevel(state.points);
  const nextTarget = (lv + 1) * 100;
  const pct = Math.min(100, state.points % 100);
  const left = nextTarget - state.points;
  const isCheckedInToday = state.checkin === dayKey();

  const badges = [
    {
      id: 'explorer',
      title: 'Lidprex Explorer',
      desc: '40 points',
      unlocked: true,
      action: '',
    },
    {
      id: 'improver',
      title: 'Project Improver',
      desc: '25 points',
      unlocked: true,
      action: '',
    },
    {
      id: 'verified',
      title: 'Verified',
      desc: 'Verify your email',
      unlocked: state.user.verified,
      action: 'verify',
    },
    {
      id: 'voice',
      title: 'Community voice',
      desc: 'Send feedback',
      unlocked: !!state.awarded.feedback,
      action: 'feedback',
    },
    {
      id: 'linked',
      title: 'Linked up',
      desc: 'Link GitHub',
      unlocked: !!state.awarded.github,
      action: 'github',
    },
  ];

  const earnTasks = [
    { id: 'verify', label: 'Verify your email', pts: 10, btnText: 'Verify email', action: 'verify' },
    { id: 'github', label: 'Link your GitHub account', pts: 10, btnText: 'Link GitHub', action: 'github' },
    { id: 'feedback', label: 'Send feedback on a feature', pts: 10, btnText: 'Send feedback', action: 'feedback' },
    { id: 'prod', label: 'Open a product', pts: 5, btnText: 'Open products', action: 'products' },
    { id: 'ticket', label: 'Open a support ticket', pts: 5, btnText: 'Open ticket', action: 'support' },
  ];

  return (
    <div className="space-y-6">
      {/* Rewards Level Card */}
      <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-[var(--cardsh)]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <span className="text-xs font-semibold text-[var(--mut2)] uppercase tracking-wider">
            Reward points
          </span>
          <div className="flex items-center gap-2">
            {state.streak > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[var(--warn)]/15 text-[var(--warn)]">
                <Flame className="w-3.5 h-3.5 fill-current" />
                {state.streak}-day streak
              </span>
            )}
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--brand)]/15 text-[var(--brandtxt)]">
              {LEVELS[lv]} level
            </span>
          </div>
        </div>

        <div className="text-4xl sm:text-5xl font-black text-[var(--fg)] tracking-tight my-2">
          {state.points}{' '}
          <small className="text-sm font-medium text-[var(--mut2)] ml-2">
            {lv >= LEVELS.length - 1 ? 'Top level reached' : `of ${nextTarget} to next level`}
          </small>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full bg-[var(--raised)] rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-[var(--brand)] transition-all duration-500 rounded-full"
            style={{ width: `${lv >= LEVELS.length - 1 ? 100 : pct}%` }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--mut2)]">
          <span>
            {lv >= LEVELS.length - 1
              ? 'You have reached the pinnacle level!'
              : `${left} points to go. Try products and share feedback to advance.`}
          </span>
          <button
            onClick={onDailyCheckin}
            disabled={isCheckedInToday}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              isCheckedInToday
                ? 'bg-[var(--raised)] text-[var(--mut2)] opacity-70 cursor-default'
                : 'bg-[var(--brand)] text-white hover:opacity-95 shadow-sm'
            }`}
          >
            {isCheckedInToday ? 'Checked in today' : 'Daily check-in +2'}
          </button>
        </div>

        {/* Level Progression Ladder SVG */}
        <div className="pt-6 mt-4 border-t border-[var(--line)] overflow-x-auto">
          <svg viewBox="0 0 470 70" className="w-full max-w-xl mx-auto h-auto">
            {/* Background line */}
            <line
              x1="40"
              y1="28"
              x2={40 + 4 * 95}
              y2="28"
              stroke="var(--raised)"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Active line */}
            <line
              x1="40"
              y1="28"
              x2={40 + lv * 95}
              y2="28"
              stroke="var(--brand)"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Level Nodes */}
            {LEVELS.map((name, i) => {
              const x = 40 + i * 95;
              const isPassed = i <= lv;
              const isCurrent = i === lv;
              return (
                <g key={i}>
                  <circle
                    cx={x}
                    cy="28"
                    r={isCurrent ? 11 : 8}
                    fill={isPassed ? 'var(--brand)' : 'var(--raised)'}
                    stroke={isCurrent ? 'var(--brand)' : 'none'}
                    strokeWidth={isCurrent ? 5 : 0}
                    strokeOpacity={0.3}
                  />
                  <text
                    x={x}
                    y="60"
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight={isCurrent ? 700 : 500}
                    fill={isCurrent ? 'var(--fg)' : 'var(--mut2)'}
                  >
                    {name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {badges.map((b) => (
          <div
            key={b.id}
            className={`bg-[var(--card)] border border-[var(--line)] rounded-2xl p-4 flex items-center gap-4 shadow-[var(--cardsh)] transition-opacity ${
              b.unlocked ? '' : 'opacity-60'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                b.unlocked
                  ? 'bg-[var(--brand)]/15 text-[var(--brandtxt)]'
                  : 'bg-[var(--raised)] text-[var(--mut2)]'
              }`}
            >
              {b.unlocked ? <Star className="w-5 h-5 fill-current" /> : <Lock className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <b className="text-sm font-bold text-[var(--fg)] block truncate">{b.title}</b>
              <div className="text-xs text-[var(--mut2)] truncate">
                {b.unlocked
                  ? b.desc.includes('points')
                    ? b.desc
                    : 'Earned'
                  : `${b.desc} to unlock`}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Ways to Earn More Card */}
      <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-[var(--cardsh)]">
        <h3 className="font-bold text-base text-[var(--fg)] mb-4">Ways to earn more</h3>
        <div className="divide-y divide-[var(--line)]">
          {earnTasks.map((t) => {
            const isDone = !!state.awarded[t.id];
            return (
              <div key={t.id} className="py-3.5 flex items-center justify-between gap-3 text-sm">
                <div>
                  <b className="font-semibold text-[var(--fg)] block">{t.label}</b>
                  <small className="text-xs text-[var(--brandtxt)] font-bold">+{t.pts} points</small>
                </div>

                {isDone ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--ok)]/15 text-[var(--ok)]">
                    Done
                  </span>
                ) : (
                  <button
                    onClick={() => onTriggerEarnAction(t.action)}
                    className="px-3.5 py-1.5 bg-[var(--raised)] border border-[var(--line)] text-xs font-bold rounded-xl text-[var(--fg)] hover:border-[var(--mut2)] transition-colors"
                  >
                    {t.btnText}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RewardsSection;
