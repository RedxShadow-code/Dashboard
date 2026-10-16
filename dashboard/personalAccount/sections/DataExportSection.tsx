import React, { useState } from 'react';
import { DashboardState } from '../types';

interface DataExportSectionProps {
  state: DashboardState;
  onGenerateExport: (jsonString: string) => void;
}

export const DataExportSection: React.FC<DataExportSectionProps> = ({ state, onGenerateExport }) => {
  const [includeProfile, setIncludeProfile] = useState(true);
  const [includeActivity, setIncludeActivity] = useState(true);
  const [includeTickets, setIncludeTickets] = useState(true);
  const [includeFeedback, setIncludeFeedback] = useState(true);
  const [includeNotifs, setIncludeNotifs] = useState(true);

  const handleExport = () => {
    const data: Record<string, any> = {};
    if (includeProfile) {
      data.profile = {
        displayName: state.user.display,
        name: state.user.name,
        username: state.user.username,
        email: state.user.email,
        backupEmail: state.user.backup,
        birthDate: state.user.birth,
        verified: state.user.verified,
      };
    }
    if (includeActivity) data.activity = state.activity;
    if (includeTickets) data.tickets = state.tickets;
    if (includeFeedback) data.feedback = state.feedback;
    if (includeNotifs) data.notifications = state.notifs;

    const formattedJson = JSON.stringify(data, null, 2);
    onGenerateExport(formattedJson);
  };

  return (
    <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-[var(--cardsh)] max-w-xl">
      <h3 className="font-bold text-base text-[var(--fg)] mb-2">Data export</h3>
      <p className="text-xs text-[var(--mut2)] mb-5">
        Choose what account data to include in your export.
      </p>

      <div className="space-y-3 mb-6">
        {[
          { label: 'Profile', checked: includeProfile, set: setIncludeProfile },
          { label: 'Activity logs', checked: includeActivity, set: setIncludeActivity },
          { label: 'Support tickets', checked: includeTickets, set: setIncludeTickets },
          { label: 'Feedback history', checked: includeFeedback, set: setIncludeFeedback },
          { label: 'Notifications', checked: includeNotifs, set: setIncludeNotifs },
        ].map((item, idx) => (
          <label key={idx} className="flex items-center gap-3 cursor-pointer text-sm font-medium text-[var(--fg)]">
            <input
              type="checkbox"
              checked={item.checked}
              onChange={(e) => item.set(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--line)] accent-[var(--brand)]"
            />
            <span>{item.label}</span>
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={handleExport}
        className="px-5 py-2.5 bg-[var(--brand)] text-white text-sm font-bold rounded-xl hover:opacity-95 shadow-sm transition-all"
      >
        Generate export
      </button>
    </div>
  );
};

export default DataExportSection;
