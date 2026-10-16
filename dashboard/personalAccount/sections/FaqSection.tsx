import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { FAQ_DATA } from '../constants';

interface FaqSectionProps {
  onNavigateAction: (actionTarget: string) => void;
  onOpenTicket: () => void;
}

export const FaqSection: React.FC<FaqSectionProps> = ({ onNavigateAction, onOpenTicket }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filteredFaqs = FAQ_DATA.map((faq, originalIndex) => ({
    ...faq,
    originalIndex,
  })).filter((faq) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      faq.q.toLowerCase().includes(q) ||
      faq.a.some((paragraph) => paragraph.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-[var(--mut2)] absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search answers (try password, GitHub, or username)"
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[var(--line)] bg-[var(--inbg)] text-[var(--fg)] text-sm focus:border-[var(--brand)] outline-none"
        />
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.length ? (
          filteredFaqs.map((faq) => {
            const isOpen =
              openIndex === faq.originalIndex || (searchQuery.trim().length > 0 && filteredFaqs.length === 1);

            return (
              <div
                key={faq.originalIndex}
                className="bg-[var(--card)] border border-[var(--line)] rounded-2xl shadow-[var(--cardsh)] overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : faq.originalIndex)}
                  className="w-full p-5 flex items-center justify-between gap-4 text-left font-bold text-sm text-[var(--fg)] hover:bg-[var(--raised)] transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-[var(--mut2)] flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[var(--mut2)] flex-shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 space-y-3 border-t border-[var(--line)] bg-[var(--card)] text-sm text-[var(--mut)]">
                    {faq.a.map((paragraph, pIdx) => (
                      <p key={pIdx} className="leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                    {faq.l && (
                      <div className="pt-2">
                        <button
                          onClick={() => onNavigateAction(faq.l[1])}
                          className="text-xs font-bold text-[var(--brandtxt)] hover:underline"
                        >
                          {faq.l[0]} →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-8 text-center text-sm text-[var(--mut2)]">
            No answers match "{searchQuery}". Try fewer words, or open a support ticket.
          </div>
        )}
      </div>

      {/* Footer Callout */}
      <div className="bg-[var(--panel)] border border-[var(--line)] rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[var(--cardsh)]">
        <span className="text-sm font-medium text-[var(--fg)] text-center sm:text-left">
          Still stuck? Open a support ticket and our team will reply directly.
        </span>
        <button
          onClick={onOpenTicket}
          className="px-4 py-2 bg-[var(--raised)] border border-[var(--line)] text-xs font-bold rounded-xl text-[var(--fg)] hover:border-[var(--mut2)] transition-colors whitespace-nowrap"
        >
          Open ticket
        </button>
      </div>
    </div>
  );
};

export default FaqSection;
