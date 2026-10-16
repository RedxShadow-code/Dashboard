import React, { useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { SupportTicket, DashboardState } from '../types';
import { ago } from '../utils';

interface OpenTicketSectionProps {
  ticket: SupportTicket;
  userEmail: string;
  onBack: () => void;
  onSendReply: (ticketId: number, message: string) => Promise<boolean>;
  onToggleStatus: (ticketId: number) => void;
  onCopyTranscript: (ticket: SupportTicket) => void;
  onRemoveTicket: (ticketId: number) => void;
}

export const OpenTicketSection: React.FC<OpenTicketSectionProps> = ({
  ticket,
  userEmail,
  onBack,
  onSendReply,
  onToggleStatus,
  onCopyTranscript,
  onRemoveTicket,
}) => {
  const [replyText, setReplyText] = useState('');
  const [replyError, setReplyError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) {
      setReplyError('Write a message first.');
      return;
    }
    setReplyError('');
    setSubmitting(true);
    const ok = await onSendReply(ticket.id, replyText.trim());
    setSubmitting(false);
    if (ok) {
      setReplyText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
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
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-bold text-[var(--brandtxt)] hover:underline mb-2"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> All tickets
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-6">
        {/* Ticket Chat Thread */}
        <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-[var(--cardsh)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[var(--line)]">
              <h2 className="text-base font-bold text-[var(--fg)]">
                <span className="text-[var(--mut2)] mr-2">#{ticket.id}</span>
                {ticket.subject}
              </h2>
              {getStatusBadge(ticket.status)}
            </div>

            {/* Conversation Messages */}
            <div className="py-6 space-y-3.5 max-h-[500px] overflow-y-auto">
              {ticket.msgs.map((msg, idx) => {
                const isMe = msg.f === 'me';
                return (
                  <div
                    key={idx}
                    className={`max-w-[85%] rounded-2xl p-3.5 text-sm ${
                      isMe
                        ? 'ml-auto bg-[var(--brand)]/10 border border-[var(--brand)]/25 text-[var(--fg)]'
                        : 'bg-[var(--raised)] text-[var(--fg)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 mb-1 text-xs">
                      <b className={`font-bold ${isMe ? 'text-[var(--brandtxt)]' : 'text-[var(--mut2)]'}`}>
                        {isMe ? 'You' : 'Support'}
                      </b>
                      <span className="text-[var(--mut2)] text-[11px]">{ago(msg.ts)}</span>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.t}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reply Input Form */}
          <form onSubmit={handleSubmit} className="pt-4 border-t border-[var(--line)] space-y-3">
            <div>
              <label className="block text-xs font-medium text-[var(--mut2)] mb-1">
                {ticket.status === 'Resolved'
                  ? 'This ticket is marked resolved. Replying will reopen it.'
                  : 'Write a reply'}
              </label>
              <textarea
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write your message..."
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--inbg)] text-[var(--fg)] text-sm focus:border-[var(--brand)] outline-none resize-none"
              />
              {replyError && <p className="text-xs text-[var(--bad)] mt-1">{replyError}</p>}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--mut2)]">
                Press Enter to send, Shift+Enter for newline
              </span>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-[var(--brand)] text-white text-xs font-bold rounded-xl hover:opacity-95 shadow-sm transition-all flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Sending...' : 'Send reply'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Details and Actions Sidebar */}
        <div className="space-y-6">
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-[var(--cardsh)] space-y-4">
            <h3 className="font-bold text-base text-[var(--fg)] mb-2">Details</h3>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs font-semibold text-[var(--mut2)] uppercase tracking-wider block">
                  Category
                </span>
                <span className="font-semibold text-[var(--fg)]">{ticket.cat}</span>
              </div>
              <div>
                <span className="text-xs font-semibold text-[var(--mut2)] uppercase tracking-wider block">
                  Contact
                </span>
                <span className="font-semibold text-[var(--fg)]">{userEmail}</span>
              </div>
              <div>
                <span className="text-xs font-semibold text-[var(--mut2)] uppercase tracking-wider block">
                  Opened
                </span>
                <span className="text-[var(--mut)]">{ago(ticket.opened)}</span>
              </div>
              <div>
                <span className="text-xs font-semibold text-[var(--mut2)] uppercase tracking-wider block">
                  Last Updated
                </span>
                <span className="text-[var(--mut)]">{ago(ticket.ts)}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--line)] space-y-2.5">
              <button
                onClick={() => onToggleStatus(ticket.id)}
                className="w-full py-2.5 bg-[var(--raised)] border border-[var(--line)] text-xs font-bold rounded-xl text-[var(--fg)] hover:border-[var(--mut2)] transition-colors"
              >
                {ticket.status === 'Resolved' ? 'Reopen ticket' : 'Mark resolved'}
              </button>
              <button
                onClick={() => onCopyTranscript(ticket)}
                className="w-full py-2.5 bg-[var(--raised)] border border-[var(--line)] text-xs font-bold rounded-xl text-[var(--fg)] hover:border-[var(--mut2)] transition-colors"
              >
                Copy transcript
              </button>
              <button
                onClick={() => onRemoveTicket(ticket.id)}
                className="w-full py-2.5 text-xs font-bold text-[var(--bad)] hover:bg-[var(--bad)]/10 rounded-xl transition-colors border border-[var(--bad)]/30"
              >
                Remove from dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpenTicketSection;
