import React, { useState } from 'react';
import { FeedbackItem, FeedbackType } from '../types';

interface FeedbackSectionProps {
  feedbackList: FeedbackItem[];
  onSubmitFeedback: (type: FeedbackType, title: string, details: string) => Promise<boolean>;
}

export const FeedbackSection: React.FC<FeedbackSectionProps> = ({
  feedbackList,
  onSubmitFeedback,
}) => {
  const [type, setType] = useState<FeedbackType>('Idea');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (title.trim().length < 3) {
      newErrors.title = 'Enter a title of at least 3 characters.';
    }
    if (details.trim().length < 10) {
      newErrors.details = 'Add a few details, at least 10 characters.';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    const ok = await onSubmitFeedback(type, title.trim(), details.trim());
    setSubmitting(false);
    if (ok) {
      setTitle('');
      setDetails('');
      setErrors({});
    }
  };

  const getStatusChip = (status: FeedbackItem['status']) => {
    switch (status) {
      case 'In review':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--warn)]/15 text-[var(--warn)]">
            In review
          </span>
        );
      case 'Responded':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--ok)]/15 text-[var(--ok)]">
            Responded
          </span>
        );
      case 'Received':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--info)]/15 text-[var(--info)]">
            Received
          </span>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Share Feedback Form */}
      <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-[var(--cardsh)]">
        <h3 className="font-bold text-base text-[var(--fg)] mb-4">Share feedback</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <span className="block text-xs font-semibold text-[var(--mut2)] mb-2">Type</span>
            <div className="flex gap-2">
              {(['Idea', 'Bug', 'Request'] as FeedbackType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`py-2 px-4 rounded-xl text-xs font-semibold border transition-all ${
                    type === t
                      ? 'bg-[var(--card)] border-[var(--brand)] text-[var(--fg)] font-bold shadow-xs'
                      : 'border-[var(--line)] text-[var(--mut)] hover:border-[var(--mut2)]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--mut2)] mb-1">Title</label>
            <input
              type="text"
              maxLength={80}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short summary"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--inbg)] text-[var(--fg)] text-sm focus:border-[var(--brand)] outline-none"
            />
            {errors.title && <p className="text-xs text-[var(--bad)] mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--mut2)] mb-1">Details</label>
            <textarea
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="What should we know?"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--inbg)] text-[var(--fg)] text-sm focus:border-[var(--brand)] outline-none resize-y"
            />
            {errors.details && <p className="text-xs text-[var(--bad)] mt-1">{errors.details}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-[var(--brand)] text-white text-sm font-bold rounded-xl hover:opacity-95 shadow-sm transition-all"
          >
            {submitting ? 'Sending...' : 'Send feedback'}
          </button>
        </form>
      </div>

      {/* Your Feedback Submissions */}
      <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-[var(--cardsh)] flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-base text-[var(--fg)] mb-4">Your feedback</h3>

          {feedbackList.length ? (
            <div className="divide-y divide-[var(--line)]">
              {feedbackList.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                  <div>
                    <b className="font-semibold text-[var(--fg)] block">
                      {item.type}: {item.title}
                    </b>
                  </div>
                  {getStatusChip(item.status)}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-[var(--mut2)]">
              Nothing submitted yet.
            </div>
          )}
        </div>

        <p className="text-xs text-[var(--mut2)] pt-4 border-t border-[var(--line)]">
          We read every single submission and prioritize product roadmap features from community
          ideas.
        </p>
      </div>
    </div>
  );
};

export default FeedbackSection;
