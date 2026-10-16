import React, { useState } from 'react';
import { HelpCircle, Plus } from 'lucide-react';
import { DashboardState, SupportTicket, TicketCategory } from '../types';
import { ago } from '../utils';

interface SupportSectionProps {
  state: DashboardState;
  onOpenTicket: (id: number) => void;
  onCreateTicket: (category: TicketCategory, subject: string, message: string) => Promise<boolean>;
  onNavigateToFaq: () => void;
}

export const SupportSection: React.FC<SupportSectionProps> = ({
  state,
  onOpenTicket,
  onCreateTicket,
  onNavigateToFaq,
}) => {
  const [category, setCategory] = useState<TicketCategory>('Account');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (subject.trim().length < 4) {
      newErrors.subject = 'Enter a subject of at least 4 characters.';
    }
    if (message.trim().length < 10) {
      newErrors.message = 'Describe the issue in at least 10 characters.';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    const ok = await onCreateTicket(category, subject.trim(), message.trim());
    setSubmitting(false);
    if (ok) {
      setSubject('');
      setMessage('');
      setErrors({});
    }
  };

  const getStatusBadge = (status: SupportTicket['status']) => {
    switch (status) {
      case 'Open':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--info)]/15 text-[var(--info)]">
            Open
          </span>
        );
      case 'In progress':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--warn)]/15 text-[var(--warn)]">
            In progress
          </span>
        );
      case 'Resolved':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--ok)]/15 text-[var(--ok)]">
            Resolved
          </span>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
      {/* Left Column: Tickets List & FAQ Callout */}
      <div className="space-y-6">
        <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-[var(--cardsh)]">
          <h3 className="font-bold text-base text-[var(--fg)] mb-4">Your tickets</h3>

          {state.tickets.length ? (
            <div className="divide-y divide-[var(--line)]">
              {state.tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => onOpenTicket(ticket.id)}
                  className="w-full py-3.5 flex items-center gap-4 text-left hover:bg-[var(--raised)] px-2 rounded-xl transition-colors group"
                >
                  <span className="text-xs font-mono font-bold text-[var(--mut2)] w-12">
                    #{ticket.id}
                  </span>
                  <div className="flex-1 min-w-0">
                    <b className="font-semibold text-sm text-[var(--fg)] block truncate group-hover:text-[var(--brandtxt)]">
                      {ticket.subject}
                    </b>
                    <small className="text-xs text-[var(--mut2)]">
                      {ticket.cat} • Updated {ago(ticket.ts).toLowerCase()}
                    </small>
                  </div>
                  {getStatusBadge(ticket.status)}
                </button>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-[var(--mut2)]">
              No tickets yet. Open one with the form.
            </div>
          )}
        </div>

        {/* Quick FAQ panel */}
        <div className="bg-[var(--panel)] border border-[var(--line)] rounded-2xl p-5 space-y-2">
          <b className="font-bold text-sm text-[var(--fg)] block">Need a quick answer?</b>
          <p className="text-xs text-[var(--mut)] leading-relaxed">
            Most common account and product questions are answered in our FAQ.
          </p>
          <button
            onClick={onNavigateToFaq}
            className="text-xs font-bold text-[var(--brandtxt)] hover:underline block pt-1"
          >
            Read the FAQ
          </button>
        </div>
      </div>

      {/* Right Column: New Ticket Form */}
      <div>
        <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-[var(--cardsh)]">
          <h3 className="font-bold text-base text-[var(--fg)] mb-4">New ticket</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <span className="block text-xs font-semibold text-[var(--mut2)] mb-2">Category</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['Account', 'Product', 'Billing', 'Other'] as TicketCategory[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                      category === cat
                        ? 'bg-[var(--card)] border-[var(--brand)] text-[var(--fg)] font-bold shadow-xs'
                        : 'border-[var(--line)] text-[var(--mut)] hover:border-[var(--mut2)]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--mut2)] mb-1">Subject</label>
              <input
                type="text"
                maxLength={80}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Short summary"
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--inbg)] text-[var(--fg)] text-sm focus:border-[var(--brand)] outline-none"
              />
              {errors.subject && <p className="text-xs text-[var(--bad)] mt-1">{errors.subject}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--mut2)] mb-1">Message</label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe what happened"
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--inbg)] text-[var(--fg)] text-sm focus:border-[var(--brand)] outline-none resize-y"
              />
              {errors.message && <p className="text-xs text-[var(--bad)] mt-1">{errors.message}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-[var(--brand)] text-white text-sm font-bold rounded-xl hover:opacity-95 shadow-sm transition-all"
            >
              {submitting ? 'Opening ticket...' : 'Open ticket'}
            </button>
            <p className="text-xs text-[var(--mut2)] text-center">
              Replies will appear directly in your ticket thread.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SupportSection;
