import React, { useState } from 'react';
import {
  LayoutDashboard,
  Boxes,
  ShieldCheck,
  Bell,
  LifeBuoy,
  Ticket as TicketIcon,
  HelpCircle,
  MessageSquarePlus,
  Sliders,
  Award,
  MoreHorizontal,
  LogOut,
} from 'lucide-react';
import { SectionId, UserProfile } from './types';

export interface SectionItem {
  id: SectionId;
  label: string;
  isSubItem?: boolean;
}

export interface PersonalAccountSidebarProps {
  theme: 'dark' | 'light' | 'system';
  activeSection: SectionId;
  onSectionChange: (id: SectionId) => void;
  onLogout: () => void;
  user: UserProfile;
  unreadNotificationsCount?: number;
  openTicketActive?: boolean;
}

export const PersonalAccountSidebar: React.FC<PersonalAccountSidebarProps> = ({
  activeSection,
  onSectionChange,
  onLogout,
  user,
  unreadNotificationsCount = 0,
  openTicketActive = false,
}) => {
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  const initial = (user.display || 'A').trim().charAt(0).toUpperCase();

  const getSectionIcon = (id: SectionId, active: boolean) => {
    const className = `w-5 h-5 transition-colors ${
      active ? 'text-pink-500' : 'text-gray-400 group-hover:text-gray-200'
    }`;
    switch (id) {
      case 'dashboard':
        return <LayoutDashboard className={className} />;
      case 'products':
        return <Boxes className={className} />;
      case 'security':
        return <ShieldCheck className={className} />;
      case 'notifications':
        return <Bell className={className} />;
      case 'support':
        return <LifeBuoy className={className} />;
      case 'open_ticket':
        return <TicketIcon className={className} />;
      case 'faq':
        return <HelpCircle className={className} />;
      case 'feedback':
        return <MessageSquarePlus className={className} />;
      case 'settings':
        return <Sliders className={className} />;
      case 'rewards':
        return <Award className={className} />;
      default:
        return <LayoutDashboard className={className} />;
    }
  };

  const navItems: SectionItem[] = [
    { id: 'dashboard', label: 'Overview' },
    { id: 'products', label: 'Products' },
    { id: 'security', label: 'Security' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'support', label: 'Support' },
    ...(openTicketActive
      ? [{ id: 'open_ticket' as SectionId, label: 'Open ticket', isSubItem: true }]
      : []),
    { id: 'faq', label: 'FAQ', isSubItem: true },
    { id: 'feedback', label: 'Feedback', isSubItem: true },
    { id: 'settings', label: 'Settings' },
    { id: 'rewards', label: 'Rewards' },
  ];

  const mobilePrimaryIds: SectionId[] = ['dashboard', 'products', 'notifications', 'settings'];
  const mobileMoreIds: SectionId[] = ['security', 'support', 'faq', 'feedback', 'rewards'];

  return (
    <>
      {/* Desktop Sticky/Fixed Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-[var(--line)] bg-[var(--side)] z-40 md:flex flex-col select-none">
        {/* Brand / Logo */}
        <div className="px-7 pt-8 pb-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--brand)] flex items-center justify-center text-white font-black text-base shadow-sm">
            L
          </div>
          <span className="font-bold text-lg tracking-tight text-[var(--fg)]">Lidprex</span>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto pb-4">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-semibold border-l-2 group text-left ${
                  item.isSubItem ? 'pl-8 text-xs py-2.5' : ''
                } ${
                  isActive
                    ? 'border-[var(--brand)] text-[var(--fg)] bg-[var(--raised)] shadow-xs'
                    : 'border-transparent text-[var(--mut)] hover:text-[var(--fg)] hover:bg-[var(--raised)]'
                }`}
              >
                {getSectionIcon(item.id, isActive)}
                <span className="flex-1 truncate">{item.label}</span>
                {item.id === 'notifications' && unreadNotificationsCount > 0 && (
                  <span className="bg-[var(--brand)] text-white text-[11px] font-bold rounded-full px-2 py-0.5 leading-none">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Card Footer */}
        <div className="p-4 border-t border-[var(--line)]">
          <button
            onClick={() => onSectionChange('settings')}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--raised)] transition-colors text-left group"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-[var(--fg)] border border-[var(--line)] transition-transform group-hover:scale-105"
              style={{
                backgroundColor: user.color || 'var(--raised)',
                color: user.color ? '#ffffff' : 'var(--fg)',
              }}
            >
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold truncate text-[var(--fg)]">{user.display}</div>
              <div className="text-xs text-[var(--mut2)] truncate">{user.email}</div>
            </div>
          </button>
          <button
            onClick={onLogout}
            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[var(--mut2)] hover:text-[var(--bad)] hover:bg-[var(--raised)] border border-[var(--line)] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 bg-[var(--card)] border border-[var(--line)] rounded-2xl shadow-xl z-50 px-2 py-2 flex items-center justify-around">
        {mobilePrimaryIds.map((id) => {
          const isActive = activeSection === id;
          const label =
            id === 'dashboard'
              ? 'Home'
              : id === 'products'
              ? 'Products'
              : id === 'notifications'
              ? 'Alerts'
              : 'Settings';
          return (
            <button
              key={id}
              onClick={() => onSectionChange(id)}
              className={`relative flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-medium transition-colors ${
                isActive ? 'text-[var(--brand)] font-bold' : 'text-[var(--mut2)]'
              }`}
            >
              {getSectionIcon(id, isActive)}
              <span>{label}</span>
              {id === 'notifications' && unreadNotificationsCount > 0 && (
                <span className="absolute top-0 right-2 w-4 h-4 bg-[var(--brand)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
          );
        })}

        <button
          onClick={() => setMobileMoreOpen(true)}
          className={`flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-medium transition-colors ${
            mobileMoreIds.includes(activeSection)
              ? 'text-[var(--brand)] font-bold'
              : 'text-[var(--mut2)]'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span>More</span>
        </button>
      </nav>

      {/* Mobile More Sheet */}
      {mobileMoreOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center md:hidden"
          onClick={() => setMobileMoreOpen(false)}
        >
          <div
            className="w-full bg-[var(--card)] rounded-t-3xl border-t border-[var(--line)] p-6 space-y-3 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-[var(--line)]">
              <h3 className="font-bold text-base text-[var(--fg)]">More Options</h3>
              <button
                onClick={() => setMobileMoreOpen(false)}
                className="text-sm font-semibold text-[var(--mut2)]"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              {mobileMoreIds.map((id) => (
                <button
                  key={id}
                  onClick={() => {
                    onSectionChange(id);
                    setMobileMoreOpen(false);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-xl text-left border border-[var(--line)] transition-colors ${
                    activeSection === id ? 'bg-[var(--raised)] border-[var(--brand)]' : ''
                  }`}
                >
                  {getSectionIcon(id, activeSection === id)}
                  <span className="text-sm font-semibold capitalize">{id.replace('_', ' ')}</span>
                </button>
              ))}
            </div>
            <div className="pt-4 border-t border-[var(--line)]">
              <button
                onClick={() => {
                  setMobileMoreOpen(false);
                  onLogout();
                }}
                className="w-full py-3 rounded-xl text-center text-sm font-bold text-[var(--bad)] bg-[var(--raised)]"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PersonalAccountSidebar;
