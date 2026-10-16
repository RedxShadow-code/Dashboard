import React from 'react';
import { ActivityEntry } from '../types';
import { ago } from '../utils';

interface ActivitySectionProps {
  activityList: ActivityEntry[];
}

export const ActivitySection: React.FC<ActivitySectionProps> = ({ activityList }) => {
  const groupLabel = (ts: number) => {
    const d0 = new Date();
    d0.setHours(0, 0, 0, 0);
    if (ts >= d0.getTime()) return 'Today';
    if (ts >= d0.getTime() - 864e5) return 'Yesterday';
    return 'Earlier';
  };

  return (
    <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-[var(--cardsh)] max-w-2xl">
      <h3 className="font-bold text-base text-[var(--fg)] mb-4">Activity history</h3>

      {activityList.length ? (
        <div className="divide-y divide-[var(--line)]">
          {activityList.map((act, idx) => {
            const prev = activityList[idx - 1];
            const showHeader = !prev || groupLabel(prev.ts) !== groupLabel(act.ts);

            return (
              <React.Fragment key={idx}>
                {showHeader && (
                  <div className="py-2.5 text-xs font-bold text-[var(--mut2)] uppercase tracking-wider">
                    {groupLabel(act.ts)}
                  </div>
                )}
                <div className="py-3 flex items-center justify-between gap-4 text-sm">
                  <span className="font-medium text-[var(--fg)] truncate">{act.t}</span>
                  <small className="text-xs text-[var(--mut2)] whitespace-nowrap flex-shrink-0">
                    {ago(act.ts)}
                  </small>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center text-sm text-[var(--mut2)]">
          No activity logs recorded yet.
        </div>
      )}
    </div>
  );
};

export default ActivitySection;
