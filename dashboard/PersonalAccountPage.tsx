import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Search,
  Bell,
  Sun,
  Moon,
  WifiOff,
  AlertCircle,
  Copy,
  Check,
  X,
  Star,
  ExternalLink,
  LifeBuoy,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import {
  DashboardState,
  SectionId,
  SettingsTab,
  SecurityTab,
  NotifTab,
  ProductKey,
  SupportTicket,
  TicketCategory,
  FeedbackType,
  UserProfile,
  ThemeMode,
  LayoutDensity,
  NetworkSim,
} from './personalAccount/types';
import {
  STORAGE_KEY,
  getDefaultState,
  PROD_INFO,
  LEVELS,
  FAQ_DATA,
  DAY,
  HR,
  MIN,
} from './personalAccount/constants';
import {
  ago,
  dayKey,
  scoreItems,
  computeSecurityScore,
  copyToClipboard,
} from './personalAccount/utils';
import PersonalAccountSidebar from './personalAccount/PersonalAccountSidebar';
import DashboardSection from './personalAccount/sections/DashboardSection';
import ProductsSection from './personalAccount/sections/ProductsSection';
import SecuritySection from './personalAccount/sections/SecuritySection';
import NotificationsSection from './personalAccount/sections/NotificationsSection';
import SupportSection from './personalAccount/sections/SupportSection';
import OpenTicketSection from './personalAccount/sections/OpenTicketSection';
import FaqSection from './personalAccount/sections/FaqSection';
import FeedbackSection from './personalAccount/sections/FeedbackSection';
import SettingsSection from './personalAccount/sections/SettingsSection';
import RewardsSection from './personalAccount/sections/RewardsSection';
import ActivitySection from './personalAccount/sections/ActivitySection';

interface ToastItem {
  id: string;
  message: string;
  bad?: boolean;
  undo?: () => void;
  undoLabel?: string;
}

export const PersonalAccountPage: React.FC = () => {
  // Load state from localStorage
  const [state, setState] = useState<DashboardState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.user) {
          const def = getDefaultState();
          return {
            ...def,
            ...parsed,
            user: { ...def.user, ...parsed.user },
            stats: { ...def.stats, ...parsed.stats },
            conn: { ...def.conn, ...parsed.conn },
            apps: { ...def.apps, ...parsed.apps },
            fav: { ...def.fav, ...parsed.fav },
            prefs: { ...def.prefs, ...parsed.prefs },
            pp: { ...def.pp, ...parsed.pp },
            tab: { ...def.tab, ...parsed.tab },
          };
        }
      }
    } catch (e) {}
    return getDefaultState();
  });

  // UI Navigation state
  const [activeSection, setActiveSection] = useState<SectionId>(() => {
    const hash = window.location.hash.slice(1);
    if (hash.startsWith('ticket:')) return 'open_ticket';
    if (hash === 'products') return 'products';
    if (hash === 'security') return 'security';
    if (hash === 'notifications') return 'notifications';
    if (hash === 'support') return 'support';
    if (hash === 'faq') return 'faq';
    if (hash === 'feedback') return 'feedback';
    if (hash === 'settings') return 'settings';
    if (hash === 'rewards') return 'rewards';
    if (hash === 'activity') return 'activity';
    return 'dashboard';
  });

  const [openTicketId, setOpenTicketId] = useState<number | null>(() => {
    const hash = window.location.hash.slice(1);
    if (hash.startsWith('ticket:')) {
      return Number(hash.split(':')[1]) || 1042;
    }
    return 1042;
  });

  // Active tabs
  const [settingsTab, setSettingsTab] = useState<SettingsTab>(state.tab.settings || 'general');
  const [securityTab, setSecurityTab] = useState<SecurityTab>(state.tab.security || 'account');
  const [notifTab, setNotifTab] = useState<NotifTab>(state.tab.notifp || 'inbox');

  // Field drafts preservation across tabs/routes
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const updateDraft = useCallback((key: string, val: string) => {
    setDrafts((prev) => ({ ...prev, [key]: val }));
  }, []);

  // Rate limiter & timers
  const [browserAlertsLockTime, setBrowserAlertsLockTime] = useState<number>(0);
  const [browserToggleTimestamps, setBrowserToggleTimestamps] = useState<number[]>([]);

  // Network Simulation State
  const [networkSim, setNetworkSim] = useState<NetworkSim>('normal');
  const [isSimulatedLoading, setIsSimulatedLoading] = useState(false);
  const [simulatedError, setSimulatedError] = useState(false);

  // User menu & command palette modals
  const [menuOpen, setMenuOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [cmdIndex, setCmdIndex] = useState(0);

  // Modals & Dialogs
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Interactive Product Modal States
  // LeakShield
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<Array<{ text: string; ok: boolean }>>([]);
  // RepoPrep
  const [repoPrepName, setRepoPrepName] = useState('');
  const [repoPrepItems, setRepoPrepItems] = useState<string[]>([]);
  const [isPreparingRepo, setIsPreparingRepo] = useState(false);
  // Idea2Project
  const [ideaText, setIdeaText] = useState('');
  const [generatedBlueprint, setGeneratedBlueprint] = useState('');

  // Save state on change
  const saveState = useCallback((updater: (prev: DashboardState) => DashboardState) => {
    setState((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, []);

  // Toast helper
  const addToast = useCallback(
    (message: string, bad: boolean = false, undo?: () => void, undoLabel?: string) => {
      const id = `${Date.now()}_${Math.random()}`;
      setToasts((prev) => [...prev.slice(-3), { id, message, bad, undo, undoLabel }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, undo ? 6500 : 3500);
    },
    []
  );

  // Log activity
  const logActivity = useCallback(
    (text: string) => {
      saveState((prev) => {
        const k = dayKey();
        const nextCount = prev.actDate === k ? prev.actCount + 1 : 1;
        const newActivity = [{ t: text, ts: Date.now() }, ...prev.activity.slice(0, 29)];
        return {
          ...prev,
          activity: newActivity,
          actDate: k,
          actCount: nextCount,
        };
      });
    },
    [saveState]
  );

  // Award points
  const awardPoints = useCallback(
    (key: string, points: number, label: string) => {
      saveState((prev) => {
        if (prev.awarded[key]) return prev;
        addToast(`+${points} points: ${label}`);
        return {
          ...prev,
          awarded: { ...prev.awarded, [key]: 1 },
          points: prev.points + points,
        };
      });
    },
    [saveState, addToast]
  );

  // Theme & Density sync
  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.dataset.theme = state.theme;
    }
    root.dataset.density = state.density;
    root.dataset.motion = state.motion ? 'on' : 'off';
  }, [state.theme, state.density, state.motion]);

  // Sync hash changes
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.slice(1);
      if (hash.startsWith('ticket:')) {
        const id = Number(hash.split(':')[1]);
        setOpenTicketId(id);
        setActiveSection('open_ticket');
      } else if (hash) {
        const validSections: SectionId[] = [
          'dashboard',
          'products',
          'security',
          'notifications',
          'support',
          'faq',
          'feedback',
          'settings',
          'rewards',
          'activity',
        ];
        if (validSections.includes(hash as SectionId)) {
          setActiveSection(hash as SectionId);
        }
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const changeSection = (id: SectionId) => {
    if (networkSim === 'slow') {
      setIsSimulatedLoading(true);
      setTimeout(() => setIsSimulatedLoading(false), 800);
    }
    setActiveSection(id);
    if (id === 'open_ticket') {
      window.location.hash = `ticket:${openTicketId || 1042}`;
    } else {
      window.location.hash = id;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Keyboard shortcuts handler
  useEffect(() => {
    let gPressTime = 0;
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT';

      if (isMod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
        return;
      }
      if (e.key === 'Escape') {
        setCmdOpen(false);
        setActiveModal(null);
        setMenuOpen(false);
        return;
      }
      if (isInput || activeModal || cmdOpen) return;

      if (e.key === '/') {
        e.preventDefault();
        setCmdOpen(true);
        return;
      }
      if (e.key === '?') {
        e.preventDefault();
        setActiveModal('shortcuts');
        return;
      }
      if (e.key === 'g') {
        gPressTime = Date.now();
        return;
      }
      if (Date.now() - gPressTime < 1200) {
        const map: Record<string, SectionId> = {
          o: 'dashboard',
          p: 'products',
          s: 'security',
          n: 'notifications',
          h: 'support',
          t: 'settings',
          r: 'rewards',
        };
        const dest = map[e.key];
        if (dest) {
          gPressTime = 0;
          changeSection(dest);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, cmdOpen, networkSim]);

  // Section titles
  const getHeaderTitle = () => {
    const hour = new Date().getHours();
    const greeting =
      hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    switch (activeSection) {
      case 'dashboard':
        return {
          title: `${greeting}, ${state.user.display}`,
          subtitle:
            computeSecurityScore(state) >= 90
              ? 'Your account is in good shape'
              : 'A few things could make your account safer',
        };
      case 'products':
        return { title: 'Connected Products', subtitle: 'Everything you use, in one place' };
      case 'security':
        return { title: 'Security', subtitle: 'Protect your account and devices' };
      case 'notifications':
        return { title: 'Notifications', subtitle: 'Alerts and updates from your products' };
      case 'support':
        return { title: 'Support', subtitle: 'Get help from the Lidprex team' };
      case 'open_ticket':
        return { title: 'Open ticket', subtitle: 'Follow the conversation with support' };
      case 'faq':
        return { title: 'Account FAQ', subtitle: 'Quick answers about your account' };
      case 'feedback':
        return { title: 'Feedback', subtitle: 'Tell us what to build next' };
      case 'settings':
        return { title: 'Settings', subtitle: 'Profile, connections, and preferences' };
      case 'rewards':
        return { title: 'Rewards', subtitle: 'Points you earn by using Lidprex' };
      case 'activity':
        return { title: 'Activity', subtitle: 'Complete log of recent actions' };
      default:
        return { title: 'Dashboard', subtitle: 'Account management' };
    }
  };

  const headerMeta = getHeaderTitle();

  // Command palette item dataset
  const cmdList = useMemo(() => {
    const list: Array<{ title: string; group: string; action: () => void }> = [
      { title: 'Go to Overview', group: 'Navigation', action: () => changeSection('dashboard') },
      { title: 'Go to Products', group: 'Navigation', action: () => changeSection('products') },
      { title: 'Go to Security', group: 'Navigation', action: () => changeSection('security') },
      { title: 'Go to Notifications', group: 'Navigation', action: () => changeSection('notifications') },
      { title: 'Go to Support', group: 'Navigation', action: () => changeSection('support') },
      { title: 'Go to FAQ', group: 'Navigation', action: () => changeSection('faq') },
      { title: 'Go to Feedback', group: 'Navigation', action: () => changeSection('feedback') },
      { title: 'Go to Settings', group: 'Navigation', action: () => changeSection('settings') },
      { title: 'Go to Rewards', group: 'Navigation', action: () => changeSection('rewards') },
      {
        title: 'Run a LeakShield scan',
        group: 'Action',
        action: () => {
          setActiveModal('leakshield');
        },
      },
      {
        title: 'Prepare a repo with RepoPrep',
        group: 'Action',
        action: () => {
          setActiveModal('repoprep');
        },
      },
      {
        title: 'Create a blueprint with Idea2Project',
        group: 'Action',
        action: () => {
          setActiveModal('idea2project');
        },
      },
      {
        title: 'Open LidBridge pushes',
        group: 'Action',
        action: () => {
          setActiveModal('lidbridge');
        },
      },
      {
        title: state.twofa ? 'Disable two-factor' : 'Turn on two-factor',
        group: 'Security',
        action: () => {
          if (state.twofa) {
            setActiveModal('disable2fa');
          } else {
            setActiveModal('enable2fa');
          }
        },
      },
      {
        title: 'Verify my email',
        group: 'Security',
        action: () => setActiveModal('verifyEmail'),
      },
      {
        title: 'Add a backup email',
        group: 'Security',
        action: () => setActiveModal('backupEmail'),
      },
      {
        title: 'View activity logs',
        group: 'Account',
        action: () => setActiveModal('activityDrawer'),
      },
      {
        title: 'Keyboard shortcuts',
        group: 'Help',
        action: () => setActiveModal('shortcuts'),
      },
      {
        title: 'Switch theme',
        group: 'Appearance',
        action: () => {
          saveState((prev) => ({
            ...prev,
            theme: prev.theme === 'dark' ? 'light' : 'dark',
          }));
          addToast(`Theme set to ${state.theme === 'dark' ? 'light' : 'dark'}`);
        },
      },
    ];

    if (!cmdQuery.trim()) return list.slice(0, 9);
    const q = cmdQuery.toLowerCase();
    return list.filter((i) => i.title.toLowerCase().includes(q) || i.group.toLowerCase().includes(q)).slice(0, 9);
  }, [cmdQuery, state.twofa, state.theme]);

  // Product modal trigger
  const handleOpenProduct = (id: ProductKey) => {
    awardPoints('prod', 5, 'opened a product');
    logActivity(`Opened ${PROD_INFO[id].name}`);
    setActiveModal(id);
  };

  // LeakShield scan runner
  const runLeakShieldScan = () => {
    if (networkSim === 'offline') {
      addToast('Scan failed. You are offline. Check your connection.', true);
      return;
    }
    setIsScanning(true);
    setScanProgress(0);
    setScanResults([]);

    let p = 0;
    const iv = setInterval(() => {
      p += 8;
      setScanProgress(Math.min(p, 100));
      if (p >= 100) {
        clearInterval(iv);
        setIsScanning(false);
        const hasWarning = Math.random() < 0.3;
        const res = [
          { text: 'No exposed API keys', ok: true },
          { text: '.env file is ignored by git', ok: true },
          hasWarning
            ? { text: 'Possible token in config.js, line 12', ok: false }
            : { text: 'No secrets in the last 20 commits', ok: true },
        ];
        setScanResults(res);
        saveState((prev) => ({
          ...prev,
          stats: { ...prev.stats, scans: prev.stats.scans + 1 },
          scans: [{ ts: Date.now(), found: hasWarning ? 1 : 0 }, ...prev.scans.slice(0, 4)],
        }));
        logActivity('Ran a LeakShield scan');
        if (hasWarning) {
          saveState((prev) => ({
            ...prev,
            notifs: [
              {
                id: Date.now(),
                type: 'security',
                title: 'LeakShield',
                text: 'A possible token was found in config.js.',
                prod: 'leakshield',
                ts: Date.now(),
                read: false,
              },
              ...prev.notifs,
            ],
          }));
        }
        addToast(
          hasWarning ? 'Scan finished with 1 warning' : 'Scan finished, no leaks found',
          hasWarning
        );
      }
    }, 140);
  };

  // RepoPrep runner
  const runRepoPrep = (repoName: string) => {
    if (!repoName.trim() || !/^[\w.-]+(\/[\w.-]+)?$/.test(repoName.trim())) {
      addToast('Enter a repository name like your-name/project.', true);
      return;
    }
    setIsPreparingRepo(true);
    setRepoPrepItems([]);

    const items = [
      'README.md added',
      'LICENSE added',
      '.gitignore updated',
      'CONTRIBUTING.md added',
      'CI workflow checked',
    ];
    let i = 0;
    const iv = setInterval(() => {
      setRepoPrepItems((prev) => [...prev, items[i]]);
      i++;
      if (i >= items.length) {
        clearInterval(iv);
        setIsPreparingRepo(false);
        saveState((prev) => ({
          ...prev,
          stats: { ...prev.stats, repos: prev.stats.repos + 1 },
        }));
        logActivity(`Prepared ${repoName} with RepoPrep`);
        addToast('Repo prepared');
      }
    }, 260);
  };

  // Idea2Project blueprint generator
  const generateIdeaBlueprint = (idea: string) => {
    if (idea.trim().length < 10) {
      addToast('Describe your idea in at least 10 characters.', true);
      return;
    }
    const words = idea
      .split(/\s+/)
      .filter((w) => w.length > 3 && !/^(that|with|helps|this|from|your|have|will|want)$/i.test(w));
    const nm =
      (words
        .slice(0, 2)
        .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase().replace(/[^a-z]/g, ''))
        .join('') || 'Idea') + 'Kit';
    const isWeb = /web|site|app|platform|dashboard/i.test(idea);

    const bp = `Name: ${nm}\nStack: ${
      isWeb ? 'React, Node.js, PostgreSQL' : 'Python, SQLite, CLI'
    }\n\nMilestones:\n1. Define the core problem and target persona\n2. Build a ${
      isWeb ? 'single-page prototype' : 'working command-line version'
    }\n3. Add authentication and database persistence\n4. Test with five real users\n5. Launch and gather feedback`;

    setGeneratedBlueprint(bp);
    saveState((prev) => ({
      ...prev,
      stats: { ...prev.stats, projects: prev.stats.projects + 1 },
    }));
    logActivity('Created a blueprint with Idea2Project');
    addToast('Blueprint created');
  };

  // 2FA Actions
  const handleTurnOnTwoFactor = (code: string) => {
    if (!/^\d{6}$/.test(code.trim())) {
      return false;
    }
    saveState((prev) => ({
      ...prev,
      twofa: true,
      notifs: [
        {
          id: Date.now(),
          type: 'security',
          title: 'Security alert',
          text: 'Two-factor authentication was turned on.',
          ts: Date.now(),
          read: false,
        },
        ...prev.notifs,
      ],
    }));
    logActivity('Turned on two-factor');
    addToast('Two-factor is on');
    setActiveModal(null);
    return true;
  };

  const handleDisableTwoFactor = () => {
    saveState((prev) => ({
      ...prev,
      twofa: false,
      notifs: [
        {
          id: Date.now(),
          type: 'security',
          title: 'Security alert',
          text: 'Two-factor authentication was turned off.',
          ts: Date.now(),
          read: false,
        },
        ...prev.notifs,
      ],
    }));
    logActivity('Turned off two-factor');
    addToast('Two-factor is off');
    setActiveModal(null);
  };

  // Email verification
  const handleVerifyEmail = (code: string) => {
    if (code.trim() !== '123456') return false;
    saveState((prev) => ({
      ...prev,
      user: { ...prev.user, verified: true },
      notifs: [
        {
          id: Date.now(),
          type: 'security',
          title: 'Security alert',
          text: 'Your email address was verified.',
          ts: Date.now(),
          read: false,
        },
        ...prev.notifs,
      ],
    }));
    logActivity('Verified your email');
    awardPoints('verify', 10, 'verified your email');
    addToast('Email verified');
    setActiveModal(null);
    return true;
  };

  // Password update
  const handleUpdatePassword = async (cur: string, nw: string, code: string) => {
    saveState((prev) => ({
      ...prev,
      pwChanged: Date.now(),
      pwCode: '',
      notifs: [
        {
          id: Date.now(),
          type: 'security',
          title: 'Security alert',
          text: 'Your password was changed.',
          ts: Date.now(),
          read: false,
        },
        ...prev.notifs,
      ],
    }));
    logActivity('Changed your password');
    addToast('Password updated');
    return true;
  };

  // GitHub Link
  const handleConnectGithub = (username: string) => {
    const clean = username.trim().replace(/^@/, '');
    if (!/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(clean)) return false;
    saveState((prev) => ({
      ...prev,
      conn: { ...prev.conn, github: clean },
      notifs: [
        {
          id: Date.now(),
          type: 'update',
          title: 'LidBridge',
          text: 'GitHub is linked. Your pushes will show up here.',
          prod: 'lidbridge',
          ts: Date.now(),
          read: false,
        },
        ...prev.notifs,
      ],
    }));
    logActivity(`Linked GitHub as @${clean}`);
    awardPoints('github', 10, 'linked GitHub');
    addToast('GitHub linked');
    setActiveModal(null);
    return true;
  };

  // Support ticket actions
  const handleCreateTicket = async (category: TicketCategory, subject: string, message: string) => {
    const newId = state.nextTicket;
    const newTicket: SupportTicket = {
      id: newId,
      subject,
      cat: category,
      status: 'Open',
      ts: Date.now(),
      opened: Date.now(),
      msgs: [{ f: 'me', t: message, ts: Date.now() }],
    };

    saveState((prev) => ({
      ...prev,
      nextTicket: prev.nextTicket + 1,
      tickets: [newTicket, ...prev.tickets],
    }));
    logActivity(`Opened ticket #${newId}`);
    awardPoints('ticket', 5, 'opened a ticket');
    addToast(`Ticket #${newId} opened`);
    setOpenTicketId(newId);
    changeSection('open_ticket');

    // Simulate auto-responder from Lidprex team
    setTimeout(() => {
      saveState((prev) => {
        const target = prev.tickets.find((t) => t.id === newId);
        if (!target) return prev;
        const autoReplies: Record<TicketCategory, string> = {
          Account: `Thanks ${prev.user.display}, we are checking your account settings now. Can you tell us when this started?`,
          Product: `Thanks ${prev.user.display}, we have passed this to the product team. Which product were you using?`,
          Billing: `Thanks ${prev.user.display}, we are looking at your billing details. We will update you shortly.`,
          Other: `Thanks ${prev.user.display}, we received your inquiry and our team is investigating.`,
        };
        const replyText = autoReplies[category];
        const updatedTicket: SupportTicket = {
          ...target,
          status: 'In progress',
          ts: Date.now(),
          msgs: [...target.msgs, { f: 'support', t: replyText, ts: Date.now() }],
        };
        return {
          ...prev,
          tickets: prev.tickets.map((t) => (t.id === newId ? updatedTicket : t)),
          notifs: [
            {
              id: Date.now(),
              type: 'update',
              title: `Support replied to #${newId}`,
              text: target.subject,
              ts: Date.now(),
              read: false,
            },
            ...prev.notifs,
          ],
        };
      });
      addToast(`Support replied to #${newId}`);
    }, 2800);

    return true;
  };

  const handleSendTicketReply = async (ticketId: number, msgText: string) => {
    saveState((prev) => {
      const target = prev.tickets.find((t) => t.id === ticketId);
      if (!target) return prev;
      const updatedTicket: SupportTicket = {
        ...target,
        status: target.status === 'Resolved' ? 'Open' : target.status,
        ts: Date.now(),
        msgs: [...target.msgs, { f: 'me', t: msgText, ts: Date.now() }],
      };
      return {
        ...prev,
        tickets: prev.tickets.map((t) => (t.id === ticketId ? updatedTicket : t)),
      };
    });
    logActivity(`Replied on ticket #${ticketId}`);
    addToast('Reply sent');

    // Simulated follow-up
    setTimeout(() => {
      saveState((prev) => {
        const target = prev.tickets.find((t) => t.id === ticketId);
        if (!target) return prev;
        const updatedTicket: SupportTicket = {
          ...target,
          ts: Date.now(),
          msgs: [
            ...target.msgs,
            { f: 'support', t: 'Got it, thank you. We are reviewing this update right away.', ts: Date.now() },
          ],
        };
        return {
          ...prev,
          tickets: prev.tickets.map((t) => (t.id === ticketId ? updatedTicket : t)),
          notifs: [
            {
              id: Date.now(),
              type: 'update',
              title: `Support replied to #${ticketId}`,
              text: target.subject,
              ts: Date.now(),
              read: false,
            },
            ...prev.notifs,
          ],
        };
      });
      addToast(`Support replied to #${ticketId}`);
    }, 2500);

    return true;
  };

  // Feedback action
  const handleSubmitFeedback = async (type: FeedbackType, title: string, details: string) => {
    const newId = Date.now();
    saveState((prev) => ({
      ...prev,
      feedback: [{ id: newId, type, title, status: 'Received', details }, ...prev.feedback],
    }));
    logActivity(`Sent feedback: ${title}`);
    awardPoints('feedback', 10, 'sent feedback');
    addToast('Thanks, your feedback was sent');

    setTimeout(() => {
      saveState((prev) => ({
        ...prev,
        feedback: prev.feedback.map((f) =>
          f.id === newId ? { ...f, status: 'In review' as const } : f
        ),
      }));
    }, 5000);

    return true;
  };

  // Daily check-in
  const handleDailyCheckin = () => {
    const today = dayKey();
    if (state.checkin === today) return;
    const yesterday = dayKey(Date.now() - DAY);
    const newStreak = state.checkin === yesterday ? state.streak + 1 : 1;

    saveState((prev) => ({
      ...prev,
      streak: newStreak,
      checkin: today,
      points: prev.points + 2,
    }));
    logActivity('Daily check-in');
    addToast(`+2 points: daily check-in, ${newStreak}-day streak`);
  };

  // If user signed out or deleted account
  if (state.out) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg)]">
        <div className="bg-[var(--card)] border border-[var(--line)] rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-[var(--brand)] text-white font-black text-2xl mx-auto flex items-center justify-center mb-4">
            L
          </div>
          <h1 className="text-2xl font-bold text-[var(--fg)] mb-2">
            {state.out === 'deleted' ? 'Account deleted' : 'You are signed out'}
          </h1>
          <p className="text-sm text-[var(--mut)] mb-6">
            {state.out === 'deleted'
              ? 'This was a demo, so no real data was destroyed. Start over with fresh sample data.'
              : 'Log back in to return to your personal dashboard.'}
          </p>
          <button
            onClick={() => {
              if (state.out === 'deleted') {
                const fresh = getDefaultState();
                setState(fresh);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
                window.location.hash = 'dashboard';
                setActiveSection('dashboard');
                addToast('Demo data restored');
              } else {
                saveState((prev) => ({ ...prev, out: null }));
              }
            }}
            className="w-full py-3 bg-[var(--brand)] text-white font-bold text-sm rounded-xl hover:opacity-95 shadow-sm transition-all"
          >
            {state.out === 'deleted' ? 'Start over' : `Log in as ${state.user.display}`}
          </button>
        </div>
      </div>
    );
  }

  const currentOpenTicket = state.tickets.find((t) => t.id === openTicketId) || state.tickets[0];
  const initial = (state.user.display || 'A').trim().charAt(0).toUpperCase();

  // Skeleton shimmer placeholder
  const renderSkeleton = () => (
    <div className="space-y-6 animate-pulse">
      <div className="h-44 w-full bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 flex gap-6">
        <div className="w-32 h-32 rounded-full bg-[var(--raised)]" />
        <div className="flex-1 space-y-3 pt-2">
          <div className="h-4 bg-[var(--raised)] rounded w-1/3" />
          <div className="h-6 bg-[var(--raised)] rounded w-2/3" />
          <div className="h-4 bg-[var(--raised)] rounded w-1/2" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="h-28 bg-[var(--card)] border border-[var(--line)] rounded-2xl p-5" />
        <div className="h-28 bg-[var(--card)] border border-[var(--line)] rounded-2xl p-5" />
        <div className="h-28 bg-[var(--card)] border border-[var(--line)] rounded-2xl p-5" />
      </div>
    </div>
  );

  // Simulated error box
  const renderErrorBox = () => (
    <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-8 max-w-lg shadow-[var(--cardsh)] space-y-4">
      <div className="w-12 h-12 rounded-xl bg-[var(--bad)]/15 border border-[var(--bad)]/35 flex items-center justify-center text-[var(--bad)]">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h2 className="text-xl font-bold text-[var(--fg)]">
        {networkSim === 'offline' ? 'You are offline' : `We could not load ${headerMeta.title.toLowerCase()}`}
      </h2>
      <p className="text-sm text-[var(--mut)]">
        {networkSim === 'offline'
          ? 'Check your connection. Nothing was lost, and your drafts are safe.'
          : 'Something went wrong on our side. Try again in a moment.'}
      </p>
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => {
            setSimulatedError(false);
            setIsSimulatedLoading(true);
            setTimeout(() => setIsSimulatedLoading(false), 500);
          }}
          className="px-4 py-2 bg-[var(--brand)] text-white text-xs font-bold rounded-xl"
        >
          Try again
        </button>
        <button
          onClick={() => {
            setSimulatedError(false);
            changeSection('dashboard');
          }}
          className="px-4 py-2 bg-[var(--raised)] border border-[var(--line)] text-xs font-semibold rounded-xl text-[var(--fg)]"
        >
          Back to Overview
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] flex">
      {/* Sidebar Navigation */}
      <PersonalAccountSidebar
        theme={state.theme}
        activeSection={activeSection}
        onSectionChange={changeSection}
        onLogout={() => {
          saveState((prev) => ({ ...prev, out: 'out' }));
        }}
        user={state.user}
        unreadNotificationsCount={state.notifs.filter((n) => !n.read).length}
        openTicketActive={activeSection === 'open_ticket'}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 p-3 sm:p-6 lg:p-8 min-w-0 pb-24 md:pb-8">
        <div className="max-w-6xl mx-auto space-y-6 bg-[var(--shell)] border border-[var(--line)] rounded-3xl p-5 sm:p-8 lg:p-10 shadow-xs">
          {/* Header Bar */}
          <header className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[var(--line)]">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--fg)]">
                {headerMeta.title}
              </h1>
              <p className="text-sm text-[var(--mut2)] mt-0.5">{headerMeta.subtitle}</p>
            </div>

            {/* Quick Actions & Profile Header Menu */}
            <div className="flex items-center gap-2.5 relative">
              {/* Search / Command palette trigger */}
              <button
                onClick={() => setCmdOpen(true)}
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl border border-[var(--line)] bg-[var(--card)] text-xs text-[var(--mut2)] hover:border-[var(--mut2)] transition-colors shadow-xs"
                title="Search or jump to"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Search or jump to</span>
                <kbd className="hidden sm:inline px-1.5 py-0.5 rounded bg-[var(--raised)] border border-[var(--line)] text-[10px] font-mono">
                  ⌘K
                </kbd>
              </button>

              {/* Notification icon */}
              <button
                onClick={() => {
                  changeSection('notifications');
                  setNotifTab('inbox');
                }}
                className="w-10 h-10 rounded-xl border border-[var(--line)] bg-[var(--card)] flex items-center justify-center text-[var(--fg)] hover:border-[var(--mut2)] relative shadow-xs"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {state.notifs.filter((n) => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--brand)] text-white text-[10px] font-bold flex items-center justify-center">
                    {state.notifs.filter((n) => !n.read).length}
                  </span>
                )}
              </button>

              {/* Account Dropdown Button */}
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className="w-10 h-10 rounded-xl border border-[var(--line)] flex items-center justify-center font-bold text-sm text-[var(--fg)] shadow-xs transition-transform hover:scale-105"
                style={{
                  backgroundColor: state.user.color || 'var(--raised)',
                  color: state.user.color ? '#ffffff' : 'var(--fg)',
                }}
              >
                {initial}
              </button>

              {/* Menu Dropdown Popup */}
              {menuOpen && (
                <div className="absolute right-0 top-12 w-52 rounded-2xl bg-[var(--card)] border border-[var(--line)] shadow-2xl p-2 z-50 space-y-1">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      changeSection('settings');
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-semibold rounded-lg hover:bg-[var(--raised)] text-[var(--fg)]"
                  >
                    Settings
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      changeSection('support');
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-semibold rounded-lg hover:bg-[var(--raised)] text-[var(--fg)]"
                  >
                    Support
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      saveState((prev) => ({
                        ...prev,
                        theme: prev.theme === 'dark' ? 'light' : 'dark',
                      }));
                      addToast(`Switched to ${state.theme === 'dark' ? 'light' : 'dark'} theme`);
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-semibold rounded-lg hover:bg-[var(--raised)] text-[var(--fg)]"
                  >
                    Switch to {state.theme === 'dark' ? 'light' : 'dark'} theme
                  </button>
                  <hr className="border-[var(--line)] my-1" />
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      saveState((prev) => ({ ...prev, out: 'out' }));
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-bold rounded-lg text-[var(--bad)] hover:bg-[var(--raised)]"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* Offline Simulator Warning Banner */}
          {networkSim === 'offline' && (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[var(--warn)]/15 border border-[var(--warn)]/30 text-[var(--fg)] text-xs">
              <WifiOff className="w-4 h-4 text-[var(--warn)] flex-shrink-0" />
              <span className="flex-1">
                You are offline. Changes cannot be permanently synced until you reconnect.
              </span>
              <button
                onClick={() => setNetworkSim('normal')}
                className="font-bold text-[var(--brandtxt)] hover:underline"
              >
                Go online
              </button>
            </div>
          )}

          {/* Active Section Rendering */}
          <main>
            {isSimulatedLoading ? (
              renderSkeleton()
            ) : simulatedError ? (
              renderErrorBox()
            ) : (
              <>
                {activeSection === 'dashboard' && (
                  <DashboardSection
                    state={state}
                    onNavigate={(dest) => changeSection(dest as SectionId)}
                    onOpenProduct={handleOpenProduct}
                    onOpenBreakdown={() => setActiveModal('breakdown')}
                    onTriggerSecurityStep={(act) => {
                      if (act === 'on2fa') setActiveModal('enable2fa');
                      else if (act === 'verify') setActiveModal('verifyEmail');
                      else if (act === 'pwgo') {
                        changeSection('security');
                        setSecurityTab('password');
                      } else if (act === 'devgo') {
                        changeSection('security');
                        setSecurityTab('history');
                      } else if (act === 'backup') setActiveModal('backupEmail');
                      else if (act === 'github') setActiveModal('github');
                      else if (act === 'prod') changeSection('products');
                      else if (act === 'feedback') changeSection('feedback');
                    }}
                    onToggleOnboard={() => {
                      saveState((prev) => ({
                        ...prev,
                        onboard: prev.onboard === 'show' ? 'hidden' : 'show',
                      }));
                    }}
                    onChangeRange={(r) => saveState((prev) => ({ ...prev, range: r }))}
                    onOpenActivityDrawer={() => setActiveModal('activityDrawer')}
                  />
                )}

                {activeSection === 'products' && (
                  <ProductsSection
                    state={state}
                    onOpenProduct={handleOpenProduct}
                    onToggleFavorite={(id) => {
                      saveState((prev) => {
                        const nextFav = !prev.fav[id];
                        if (nextFav) logActivity(`Saved ${PROD_INFO[id].name} to favorites`);
                        addToast(nextFav ? 'Saved to favorites' : 'Removed from favorites');
                        return {
                          ...prev,
                          fav: { ...prev.fav, [id]: nextFav },
                        };
                      });
                    }}
                    onConnectGithub={() => setActiveModal('github')}
                    onOpenActivityDrawer={() => setActiveModal('activityDrawer')}
                  />
                )}

                {activeSection === 'security' && (
                  <SecuritySection
                    state={state}
                    activeTab={securityTab}
                    onTabChange={setSecurityTab}
                    onOpenTwoFactorModal={() => setActiveModal('enable2fa')}
                    onDisableTwoFactor={() => setActiveModal('disable2fa')}
                    onOpenRecoveryCodesModal={() => setActiveModal('recoveryCodes')}
                    onOpenVerifyEmailModal={() => setActiveModal('verifyEmail')}
                    onOpenBreakdownModal={() => setActiveModal('breakdown')}
                    onSignOutSession={(sId) => {
                      saveState((prev) => ({
                        ...prev,
                        sessions: prev.sessions.filter((s) => s.id !== sId),
                      }));
                      logActivity('Signed out a device');
                      addToast('Signed out device');
                    }}
                    onSignOutOthers={() => {
                      const count = state.sessions.length - 1;
                      saveState((prev) => ({
                        ...prev,
                        sessions: prev.sessions.filter((s) => s.cur),
                        notifs: [
                          {
                            id: Date.now(),
                            type: 'security',
                            title: 'Security alert',
                            text: `You signed out ${count} other device${count === 1 ? '' : 's'}.`,
                            ts: Date.now(),
                            read: false,
                          },
                          ...prev.notifs,
                        ],
                      }));
                      logActivity('Signed out other devices');
                      addToast(`Signed out ${count} device${count === 1 ? '' : 's'}`);
                    }}
                    onUpdatePassword={handleUpdatePassword}
                    onSendPasswordCode={() => {
                      saveState((prev) => ({ ...prev, pwCode: '482913' }));
                      addToast('Code sent. In this demo the code is 482913.');
                    }}
                    onTriggerSecurityAction={(act) => {
                      if (act === 'on2fa') setActiveModal('enable2fa');
                      else if (act === 'verify') setActiveModal('verifyEmail');
                      else if (act === 'pwgo') setSecurityTab('password');
                      else if (act === 'devgo') setSecurityTab('history');
                      else if (act === 'backup') setActiveModal('backupEmail');
                    }}
                    drafts={drafts}
                    onUpdateDraft={updateDraft}
                  />
                )}

                {activeSection === 'notifications' && (
                  <NotificationsSection
                    state={state}
                    activeTab={notifTab}
                    onTabChange={setNotifTab}
                    onToggleRead={(nId) => {
                      saveState((prev) => ({
                        ...prev,
                        notifs: prev.notifs.map((n) => (n.id === nId ? { ...n, read: !n.read } : n)),
                      }));
                    }}
                    onDismiss={(nId) => {
                      const dismissed = state.notifs.find((n) => n.id === nId);
                      saveState((prev) => ({
                        ...prev,
                        notifs: prev.notifs.filter((n) => n.id !== nId),
                      }));
                      if (dismissed) {
                        addToast('Notification dismissed', false, () => {
                          saveState((prev) => ({
                            ...prev,
                            notifs: [dismissed, ...prev.notifs].sort((a, b) => b.ts - a.ts),
                          }));
                        });
                      }
                    }}
                    onMarkAllRead={() => {
                      const unreadIds = state.notifs.filter((n) => !n.read).map((n) => n.id);
                      saveState((prev) => ({
                        ...prev,
                        notifs: prev.notifs.map((n) => ({ ...n, read: true })),
                      }));
                      addToast('All notifications marked read', false, () => {
                        saveState((prev) => ({
                          ...prev,
                          notifs: prev.notifs.map((n) =>
                            unreadIds.includes(n.id) ? { ...n, read: false } : n
                          ),
                        }));
                      });
                    }}
                    onToggleEmailPref={(key) => {
                      saveState((prev) => ({
                        ...prev,
                        prefs: { ...prev.prefs, [key]: !prev.prefs[key] },
                      }));
                      addToast('Email preferences updated');
                    }}
                    onToggleBrowserAlerts={() => {
                      const now = Date.now();
                      const recent = browserToggleTimestamps.filter((t) => now - t < 20000);
                      if (browserAlertsLockTime > now) return;
                      if (recent.length >= 3) {
                        const lockUntil = recent[0] + 20000;
                        setBrowserAlertsLockTime(lockUntil);
                        addToast('Too many changes. Please wait.', true);
                        return;
                      }
                      setBrowserToggleTimestamps([...recent, now]);
                      saveState((prev) => ({ ...prev, browser: !prev.browser }));
                      addToast(`Browser alerts ${!state.browser ? 'on' : 'off'}`);
                    }}
                    browserAlertsLockTime={browserAlertsLockTime}
                    onToggleProductChannel={(prodId, channel) => {
                      saveState((prev) => ({
                        ...prev,
                        pp: {
                          ...prev.pp,
                          [prodId]: {
                            ...prev.pp[prodId],
                            [channel]: !prev.pp[prodId][channel],
                          },
                        },
                      }));
                      addToast(`${PROD_INFO[prodId].name}: ${channel} channel toggled`);
                    }}
                    onChangeProductMute={(prodId, hours) => {
                      const prevMute = state.pp[prodId].mute;
                      const newMute = hours === 0 ? 0 : hours === -1 ? -1 : Date.now() + hours * HR;
                      saveState((prev) => ({
                        ...prev,
                        pp: {
                          ...prev.pp,
                          [prodId]: {
                            ...prev.pp[prodId],
                            mute: newMute,
                          },
                        },
                      }));
                      addToast(
                        `${PROD_INFO[prodId].name} ${hours === 0 ? 'unmuted' : 'muted'}`,
                        false,
                        () => {
                          saveState((prev) => ({
                            ...prev,
                            pp: {
                              ...prev.pp,
                              [prodId]: { ...prev.pp[prodId], mute: prevMute },
                            },
                          }));
                        }
                      );
                    }}
                    onSendProductTest={(prodId) => {
                      const pref = state.pp[prodId];
                      const muted = pref.mute === -1 || pref.mute > Date.now();
                      if (muted) {
                        addToast(`${PROD_INFO[prodId].name} is currently muted. Nothing was sent.`);
                        return;
                      }
                      const sentChans: string[] = [];
                      if (pref.inapp) {
                        saveState((prev) => ({
                          ...prev,
                          notifs: [
                            {
                              id: Date.now(),
                              type: 'update',
                              prod: prodId,
                              title: PROD_INFO[prodId].name,
                              text: 'This is a test notification.',
                              ts: Date.now(),
                              read: false,
                            },
                            ...prev.notifs,
                          ],
                        }));
                        sentChans.push('In-app');
                      }
                      if (pref.email) sentChans.push('Email');
                      if (pref.browser && state.browser) sentChans.push('Browser');

                      if (sentChans.length) {
                        addToast(`Test sent: ${sentChans.join(', ')}`);
                      } else {
                        addToast(`All delivery channels are off for ${PROD_INFO[prodId].name}.`);
                      }
                    }}
                    onResetProductPrefs={() => {
                      saveState((prev) => ({
                        ...prev,
                        pp: {
                          leakshield: { email: true, inapp: true, browser: false, mute: 0 },
                          repoprep: { email: true, inapp: true, browser: false, mute: 0 },
                          idea2project: { email: true, inapp: true, browser: false, mute: 0 },
                          lidbridge: { email: true, inapp: true, browser: false, mute: 0 },
                        },
                      }));
                      addToast('Product notification preferences reset to defaults');
                    }}
                  />
                )}

                {activeSection === 'support' && (
                  <SupportSection
                    state={state}
                    onOpenTicket={(id) => {
                      setOpenTicketId(id);
                      changeSection('open_ticket');
                    }}
                    onCreateTicket={handleCreateTicket}
                    onNavigateToFaq={() => changeSection('faq')}
                  />
                )}

                {activeSection === 'open_ticket' && (
                  <OpenTicketSection
                    ticket={currentOpenTicket}
                    userEmail={state.user.email}
                    onBack={() => changeSection('support')}
                    onSendReply={handleSendTicketReply}
                    onToggleStatus={(tId) => {
                      saveState((prev) => {
                        const target = prev.tickets.find((t) => t.id === tId);
                        if (!target) return prev;
                        const nextStatus = target.status === 'Resolved' ? 'Open' : 'Resolved';
                        return {
                          ...prev,
                          tickets: prev.tickets.map((t) =>
                            t.id === tId ? { ...t, status: nextStatus, ts: Date.now() } : t
                          ),
                        };
                      });
                      addToast('Ticket status updated');
                    }}
                    onCopyTranscript={(t) => {
                      const transcript =
                        `#${t.id} ${t.subject} (${t.status})\n\n` +
                        t.msgs
                          .map((m) => `${m.f === 'me' ? 'You' : 'Support'} (${ago(m.ts)}): ${m.t}`)
                          .join('\n');
                      setModalData({ transcript });
                      setActiveModal('transcript');
                    }}
                    onRemoveTicket={(tId) => {
                      const removed = state.tickets.find((t) => t.id === tId);
                      saveState((prev) => ({
                        ...prev,
                        tickets: prev.tickets.filter((t) => t.id !== tId),
                      }));
                      changeSection('support');
                      if (removed) {
                        addToast(`Ticket #${tId} removed`, false, () => {
                          saveState((prev) => ({
                            ...prev,
                            tickets: [removed, ...prev.tickets].sort((a, b) => b.ts - a.ts),
                          }));
                        });
                      }
                    }}
                  />
                )}

                {activeSection === 'faq' && (
                  <FaqSection
                    onNavigateAction={(dest) => {
                      if (dest === 'settings') changeSection('settings');
                      else if (dest === 'photo') {
                        changeSection('settings');
                        setSettingsTab('general');
                        setActiveModal('photoColor');
                      } else if (dest === 'security') changeSection('security');
                      else if (dest === 'github') setActiveModal('github');
                      else if (dest === 'notifications') changeSection('notifications');
                      else if (dest === 'danger') {
                        changeSection('settings');
                        setSettingsTab('danger');
                      }
                    }}
                    onOpenTicket={() => changeSection('support')}
                  />
                )}

                {activeSection === 'feedback' && (
                  <FeedbackSection
                    feedbackList={state.feedback}
                    onSubmitFeedback={handleSubmitFeedback}
                  />
                )}

                {activeSection === 'settings' && (
                  <SettingsSection
                    state={state}
                    activeTab={settingsTab}
                    onTabChange={setSettingsTab}
                    onUpdateProfile={async (prof) => {
                      saveState((prev) => ({
                        ...prev,
                        user: { ...prev.user, ...prof },
                      }));
                      logActivity('Updated your profile');
                      addToast('Profile saved');
                      return true;
                    }}
                    onChangeAvatarColor={() => setActiveModal('photoColor')}
                    onConnectGithub={() => setActiveModal('github')}
                    onDisconnectGithub={() => {
                      const prevVal = state.conn.github;
                      saveState((prev) => ({
                        ...prev,
                        conn: { ...prev.conn, github: '' },
                      }));
                      addToast('GitHub disconnected', false, () => {
                        saveState((prev) => ({
                          ...prev,
                          conn: { ...prev.conn, github: prevVal },
                        }));
                      });
                    }}
                    onConnectDiscord={() => setActiveModal('discord')}
                    onDisconnectDiscord={() => {
                      const prevVal = state.conn.discord;
                      saveState((prev) => ({
                        ...prev,
                        conn: { ...prev.conn, discord: '' },
                      }));
                      addToast('Discord disconnected', false, () => {
                        saveState((prev) => ({
                          ...prev,
                          conn: { ...prev.conn, discord: prevVal },
                        }));
                      });
                    }}
                    onVerifyEmail={() => setActiveModal('verifyEmail')}
                    onAddBackupEmail={() => setActiveModal('backupEmail')}
                    onRemoveBackupEmail={() => {
                      const prevVal = state.user.backup;
                      saveState((prev) => ({
                        ...prev,
                        user: { ...prev.user, backup: '' },
                      }));
                      addToast('Backup email removed', false, () => {
                        saveState((prev) => ({
                          ...prev,
                          user: { ...prev.user, backup: prevVal },
                        }));
                      });
                    }}
                    onNavigateToSecurity={() => {
                      changeSection('security');
                      setSecurityTab('account');
                    }}
                    onToggleAppVisibility={(prodId) => {
                      saveState((prev) => ({
                        ...prev,
                        apps: {
                          ...prev.apps,
                          [prodId]: prev.apps[prodId] === false,
                        },
                      }));
                    }}
                    onSetTheme={(t) => {
                      saveState((prev) => ({ ...prev, theme: t }));
                      addToast(`Theme set to ${t}`);
                    }}
                    onPreviewTheme={(t) => {
                      if (t) {
                        document.documentElement.dataset.theme = t === 'system' ? '' : t;
                      } else {
                        document.documentElement.dataset.theme =
                          state.theme === 'system' ? '' : state.theme;
                      }
                    }}
                    onSetDensity={(d) => {
                      saveState((prev) => ({ ...prev, density: d }));
                      addToast(`Layout density set to ${d}`);
                    }}
                    onSetNetworkSim={(sim) => {
                      setNetworkSim(sim);
                      addToast(`Network simulation set to ${sim}`);
                    }}
                    onReloadPage={() => {
                      setIsSimulatedLoading(true);
                      setTimeout(() => setIsSimulatedLoading(false), 700);
                      addToast('Page reloaded');
                    }}
                    onTriggerFailNext={() => {
                      setSimulatedError(true);
                      addToast('Simulating error state');
                    }}
                    onToggleMotion={() => {
                      saveState((prev) => ({ ...prev, motion: !prev.motion }));
                      addToast(`Animations ${!state.motion ? 'enabled' : 'disabled'}`);
                    }}
                    onToggleOnboardSetting={() => {
                      saveState((prev) => ({
                        ...prev,
                        onboard: prev.onboard === 'show' ? 'hidden' : 'show',
                      }));
                    }}
                    onToggleHoverTabs={() => {
                      saveState((prev) => ({ ...prev, hoverTabs: !prev.hoverTabs }));
                      addToast(`Hover shortcuts ${!state.hoverTabs ? 'on' : 'off'}`);
                    }}
                    onOpenShortcutsModal={() => setActiveModal('shortcuts')}
                    onGenerateExport={(json) => {
                      setModalData({ exportJson: json });
                      setActiveModal('exportJson');
                    }}
                    onResetDemoData={() => setActiveModal('resetData')}
                    onDeleteAccount={() => setActiveModal('deleteAccount')}
                  />
                )}

                {activeSection === 'rewards' && (
                  <RewardsSection
                    state={state}
                    onDailyCheckin={handleDailyCheckin}
                    onTriggerEarnAction={(actionKey) => {
                      if (actionKey === 'verify') setActiveModal('verifyEmail');
                      else if (actionKey === 'github') setActiveModal('github');
                      else if (actionKey === 'feedback') changeSection('feedback');
                      else if (actionKey === 'products') changeSection('products');
                      else if (actionKey === 'support') changeSection('support');
                    }}
                  />
                )}

                {activeSection === 'activity' && (
                  <ActivitySection activityList={state.activity} />
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* COMMAND PALETTE MODAL (CMD+K) */}
      {cmdOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-start justify-center pt-24 p-4"
          onClick={() => setCmdOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-[var(--card)] border border-[var(--line)] rounded-2xl shadow-2xl p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <Search className="w-5 h-5 text-[var(--mut2)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                autoFocus
                type="text"
                value={cmdQuery}
                onChange={(e) => {
                  setCmdQuery(e.target.value);
                  setCmdIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setCmdIndex((prev) => Math.min(prev + 1, cmdList.length - 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setCmdIndex((prev) => Math.max(prev - 1, 0));
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (cmdList[cmdIndex]) {
                      setCmdOpen(false);
                      cmdList[cmdIndex].action();
                    }
                  }
                }}
                placeholder="Search pages, actions, settings, or tickets..."
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-[var(--line)] bg-[var(--inbg)] text-[var(--fg)] text-sm focus:border-[var(--brand)] outline-none"
              />
            </div>

            <div className="max-h-72 overflow-y-auto space-y-1">
              {cmdList.map((item, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setCmdOpen(false);
                    item.action();
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-sm transition-colors ${
                    cmdIndex === i
                      ? 'bg-[var(--raised)] text-[var(--brandtxt)] font-bold'
                      : 'text-[var(--fg)] hover:bg-[var(--raised)]'
                  }`}
                >
                  <span>{item.title}</span>
                  <span className="text-xs text-[var(--mut2)] font-normal">{item.group}</span>
                </button>
              ))}
              {cmdList.length === 0 && (
                <div className="p-6 text-center text-xs text-[var(--mut2)]">No matches found.</div>
              )}
            </div>
            <div className="text-[11px] text-[var(--mut2)] pt-2 border-t border-[var(--line)] flex justify-between">
              <span>Use ↑ ↓ to navigate, Enter to choose, Esc to close</span>
            </div>
          </div>
        </div>
      )}

      {/* KEYBOARD SHORTCUTS MODAL (?) */}
      {activeModal === 'shortcuts' && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-md bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-[var(--line)]">
              <h3 className="font-bold text-base text-[var(--fg)]">Keyboard shortcuts</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-[var(--mut2)] hover:text-[var(--fg)]"
              >
                ✕
              </button>
            </div>
            <div className="divide-y divide-[var(--line)] text-sm">
              {[
                ['⌘K or /', 'Search and run actions'],
                ['?', 'Show this shortcuts list'],
                ['g then o', 'Overview'],
                ['g then p', 'Products'],
                ['g then s', 'Security'],
                ['g then n', 'Notifications'],
                ['g then h', 'Support'],
                ['g then t', 'Settings'],
                ['g then r', 'Rewards'],
                ['Esc', 'Close any dialog'],
              ].map(([key, desc], i) => (
                <div key={i} className="py-2.5 flex justify-between items-center">
                  <span className="text-[var(--mut)]">{desc}</span>
                  <kbd className="px-2 py-1 rounded bg-[var(--raised)] border border-[var(--line)] font-mono text-xs text-[var(--fg)] font-bold">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECURITY BREAKDOWN MODAL */}
      {activeModal === 'breakdown' && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-lg bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-[var(--line)]">
              <h3 className="font-bold text-base text-[var(--fg)]">
                Security score: {computeSecurityScore(state)} of 100
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-[var(--mut2)] hover:text-[var(--fg)]"
              >
                ✕
              </button>
            </div>
            <div className="divide-y divide-[var(--line)] max-h-96 overflow-y-auto">
              {scoreItems(state).map((item, i) => (
                <div key={i} className="py-3 flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span className={item.on ? 'text-[var(--ok)]' : 'text-[var(--mut2)]'}>
                      {item.on ? <Check className="w-5 h-5" /> : '—'}
                    </span>
                    <div>
                      <b className="font-bold text-[var(--fg)] block">{item.l}</b>
                      <small className="text-xs text-[var(--mut2)]">{item.on ? 'Done' : item.why}</small>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      item.on ? 'bg-[var(--ok)]/15 text-[var(--ok)]' : 'bg-[var(--raised)] text-[var(--mut2)]'
                    }`}
                  >
                    {item.on ? `+${item.pts} pts` : `${item.pts} pts`}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-2 text-right">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-[var(--brand)] text-white text-xs font-bold rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VERIFY EMAIL MODAL */}
      {activeModal === 'verifyEmail' && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-md bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-base text-[var(--fg)]">Verify your email</h3>
            <p className="text-sm text-[var(--mut)]">
              We will send a 6-digit confirmation code to <b>{state.user.email}</b>.
            </p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => addToast('Code sent. In this demo the code is 123456.')}
                className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-[var(--line)] text-[var(--fg)] hover:border-[var(--mut2)]"
              >
                Send code
              </button>
              <input
                type="text"
                maxLength={6}
                id="verifyCodeInput"
                placeholder="6-digit code (use 123456)"
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--inbg)] text-[var(--fg)] font-mono text-sm outline-none focus:border-[var(--brand)]"
              />
              <p className="text-xs text-[var(--mut2)]">In this demo, the code is 123456.</p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--line)]">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-[var(--fg)]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const input = document.getElementById('verifyCodeInput') as HTMLInputElement;
                  const val = input ? input.value : '';
                  if (!handleVerifyEmail(val)) {
                    addToast('Invalid verification code. Please enter 123456.', true);
                  }
                }}
                className="px-4 py-2 bg-[var(--brand)] text-white text-xs font-bold rounded-xl"
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ENABLE 2FA MODAL */}
      {activeModal === 'enable2fa' && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-md bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-base text-[var(--fg)]">Turn on two-factor</h3>
            <p className="text-sm text-[var(--mut)]">
              Add this secret key to your authenticator app, then enter the 6-digit code it shows.
            </p>
            <div className="p-3 bg-[var(--raised)] border border-[var(--line)] rounded-xl text-center font-mono font-bold tracking-widest text-[var(--fg)] text-sm">
              JBSW Y3DP EHPK 3PXP
            </div>
            <input
              type="text"
              id="twoFactorCodeInput"
              maxLength={6}
              placeholder="6-digit code (e.g. 123456)"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--inbg)] text-[var(--fg)] font-mono text-sm outline-none focus:border-[var(--brand)]"
            />
            <p className="text-xs text-[var(--mut2)]">In this demo, any 6 digits will work.</p>
            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--line)]">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-[var(--fg)]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const input = document.getElementById('twoFactorCodeInput') as HTMLInputElement;
                  const val = input ? input.value : '';
                  if (!handleTurnOnTwoFactor(val)) {
                    addToast('Enter a 6-digit numeric code from your authenticator app.', true);
                  }
                }}
                className="px-4 py-2 bg-[var(--brand)] text-white text-xs font-bold rounded-xl"
              >
                Turn on
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISABLE 2FA CONFIRMATION MODAL */}
      {activeModal === 'disable2fa' && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-md bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-base text-[var(--bad)]">Disable two-factor?</h3>
            <p className="text-sm text-[var(--mut)] leading-relaxed">
              Your account will be less protected and your security score will drop by 20 points.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--line)]">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-[var(--fg)]"
              >
                Cancel
              </button>
              <button
                onClick={handleDisableTwoFactor}
                className="px-4 py-2 bg-[var(--bad)] text-white text-xs font-bold rounded-xl"
              >
                Disable
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECOVERY CODES MODAL */}
      {activeModal === 'recoveryCodes' && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-md bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-[var(--line)]">
              <h3 className="font-bold text-base text-[var(--fg)]">Recovery codes</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-[var(--mut2)] hover:text-[var(--fg)]"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-[var(--mut2)]">
              Each code works once. Keep them stored somewhere safe offline.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {state.codes.map((code, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg border border-[var(--line)] bg-[var(--inbg)] text-center font-mono text-xs font-bold text-[var(--fg)]"
                >
                  {code}
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-[var(--line)]">
              <button
                onClick={() => {
                  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                  const rnd = (len: number) =>
                    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
                  const newCodes = Array.from({ length: 8 }, () => `${rnd(4)}-${rnd(4)}`);
                  saveState((prev) => ({ ...prev, codes: newCodes }));
                  logActivity('Regenerated recovery codes');
                  addToast('New recovery codes generated');
                }}
                className="text-xs font-bold text-[var(--brandtxt)] hover:underline"
              >
                Regenerate
              </button>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    await copyToClipboard(state.codes.join('\n'));
                    addToast('Codes copied to clipboard');
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-[var(--line)] text-[var(--fg)]"
                >
                  Copy
                </button>
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-1.5 bg-[var(--brand)] text-white text-xs font-bold rounded-xl"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BACKUP EMAIL MODAL */}
      {activeModal === 'backupEmail' && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-md bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-base text-[var(--fg)]">Add backup email</h3>
            <p className="text-sm text-[var(--mut)]">
              Use a different address from your primary email.
            </p>
            <input
              type="email"
              id="backupEmailInput"
              placeholder="name@example.com"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--inbg)] text-[var(--fg)] text-sm outline-none focus:border-[var(--brand)]"
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--line)]">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-[var(--fg)]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const input = document.getElementById('backupEmailInput') as HTMLInputElement;
                  const val = input ? input.value.trim() : '';
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                    addToast('Enter a valid email address.', true);
                    return;
                  }
                  if (val.toLowerCase() === state.user.email.toLowerCase()) {
                    addToast('Use an address different from your primary email.', true);
                    return;
                  }
                  saveState((prev) => ({
                    ...prev,
                    user: { ...prev.user, backup: val },
                  }));
                  logActivity('Added a backup email');
                  addToast('Backup email saved');
                  setActiveModal(null);
                }}
                className="px-4 py-2 bg-[var(--brand)] text-white text-xs font-bold rounded-xl"
              >
                Save email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GITHUB LINK MODAL */}
      {activeModal === 'github' && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-md bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-base text-[var(--fg)]">Link GitHub</h3>
            <p className="text-sm text-[var(--mut)]">
              Enter your GitHub handle to synchronize pushes with LidBridge.
            </p>
            <input
              type="text"
              id="githubHandleInput"
              placeholder="username"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--inbg)] text-[var(--fg)] text-sm outline-none focus:border-[var(--brand)]"
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--line)]">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-[var(--fg)]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const input = document.getElementById('githubHandleInput') as HTMLInputElement;
                  const val = input ? input.value : '';
                  if (!handleConnectGithub(val)) {
                    addToast('Please enter a valid GitHub username.', true);
                  }
                }}
                className="px-4 py-2 bg-[var(--brand)] text-white text-xs font-bold rounded-xl"
              >
                Link GitHub
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISCORD LINK MODAL */}
      {activeModal === 'discord' && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-md bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-base text-[var(--fg)]">Link Discord</h3>
            <input
              type="text"
              id="discordHandleInput"
              placeholder="name#0000"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--inbg)] text-[var(--fg)] text-sm outline-none focus:border-[var(--brand)]"
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--line)]">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-[var(--fg)]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const input = document.getElementById('discordHandleInput') as HTMLInputElement;
                  const val = input ? input.value.trim() : '';
                  if (val.length < 3) {
                    addToast('Enter a valid Discord handle.', true);
                    return;
                  }
                  saveState((prev) => ({
                    ...prev,
                    conn: { ...prev.conn, discord: val },
                  }));
                  addToast('Discord connected');
                  setActiveModal(null);
                }}
                className="px-4 py-2 bg-[var(--brand)] text-white text-xs font-bold rounded-xl"
              >
                Link Discord
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AVATAR COLOR PICKER MODAL */}
      {activeModal === 'photoColor' && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-sm bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-base text-[var(--fg)]">Change photo</h3>
            <p className="text-sm text-[var(--mut)]">Pick an accent color for your profile avatar.</p>
            <div className="flex flex-wrap gap-3 py-2">
              {['', '#EC4899', '#8b5cf6', '#0ea5a4', '#d97706', '#2563eb', '#e11d48'].map((col, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    saveState((prev) => ({
                      ...prev,
                      user: { ...prev.user, color: col },
                    }));
                    addToast('Avatar color updated');
                    setActiveModal(null);
                  }}
                  className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center ${
                    state.user.color === col ? 'border-[var(--fg)] scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: col || 'var(--raised)' }}
                >
                  {state.user.color === col && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT MODAL: LEAKSHIELD (INTERACTIVE LIVE SCANNER) */}
      {activeModal === 'leakshield' && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-lg bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-[var(--line)]">
              <h3 className="font-bold text-base text-[var(--fg)]">LeakShield</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-[var(--mut2)] hover:text-[var(--fg)]"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-[var(--mut)]">
              Scan repositories and staged files for exposed API keys, secret credentials, and tokens before you push.
            </p>

            <div className="space-y-4">
              <button
                disabled={isScanning}
                onClick={runLeakShieldScan}
                className="px-4 py-2 bg-[var(--brand)] text-white text-xs font-bold rounded-xl hover:opacity-95 disabled:opacity-50"
              >
                {isScanning ? 'Scanning...' : scanResults.length ? 'Run again' : 'Run scan'}
              </button>

              {isScanning && (
                <div className="space-y-1">
                  <div className="h-2 w-full bg-[var(--raised)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--brand)] transition-all duration-150"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-[var(--mut2)]">{scanProgress}% complete</span>
                </div>
              )}

              {scanResults.length > 0 && (
                <div className="space-y-2 pt-1 border-t border-[var(--line)] text-xs">
                  {scanResults.map((r, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 font-medium ${
                        r.ok ? 'text-[var(--ok)]' : 'text-[var(--warn)]'
                      }`}
                    >
                      {r.ok ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      <span>{r.text}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-3 border-t border-[var(--line)]">
                <span className="text-xs font-semibold text-[var(--mut2)] uppercase tracking-wider block mb-2">
                  Recent scans
                </span>
                <div className="divide-y divide-[var(--line)] text-xs">
                  {state.scans.slice(0, 3).map((s, idx) => (
                    <div key={idx} className="py-2 flex justify-between">
                      <span className={s.found ? 'text-[var(--warn)] font-semibold' : 'text-[var(--fg)]'}>
                        {s.found ? '1 warning' : 'No issues'}
                      </span>
                      <span className="text-[var(--mut2)]">{ago(s.ts)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT MODAL: REPOPREP (PROGRESSIVE AUDIT CHECKLIST) */}
      {activeModal === 'repoprep' && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-lg bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-[var(--line)]">
              <h3 className="font-bold text-base text-[var(--fg)]">RepoPrep</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-[var(--mut2)] hover:text-[var(--fg)]"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-[var(--mut)]">
              Get a repository ready to share. Enter its name and we will check and audit the essentials.
            </p>
            <input
              type="text"
              value={repoPrepName}
              onChange={(e) => setRepoPrepName(e.target.value)}
              placeholder="organization/project-name"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--inbg)] text-[var(--fg)] text-sm outline-none focus:border-[var(--brand)]"
            />
            <button
              disabled={isPreparingRepo}
              onClick={() => runRepoPrep(repoPrepName)}
              className="px-4 py-2 bg-[var(--brand)] text-white text-xs font-bold rounded-xl disabled:opacity-50"
            >
              {isPreparingRepo ? 'Preparing...' : 'Prepare repo'}
            </button>

            {repoPrepItems.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[var(--line)] text-xs">
                {repoPrepItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[var(--ok)] font-medium animate-fade-in">
                    <Check className="w-4 h-4" /> {item}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRODUCT MODAL: IDEA2PROJECT (BLUEPRINT GENERATOR) */}
      {activeModal === 'idea2project' && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-lg bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-[var(--line)]">
              <h3 className="font-bold text-base text-[var(--fg)]">Idea2Project</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-[var(--mut2)] hover:text-[var(--fg)]"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-[var(--mut)]">
              Describe your software concept and generate a starter blueprint with architecture milestones.
            </p>
            <textarea
              rows={3}
              value={ideaText}
              onChange={(e) => setIdeaText(e.target.value)}
              placeholder="e.g. A web app that helps students share notes and study flashcards"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--inbg)] text-[var(--fg)] text-sm outline-none focus:border-[var(--brand)] resize-none"
            />
            <button
              onClick={() => generateIdeaBlueprint(ideaText)}
              className="px-4 py-2 bg-[var(--brand)] text-white text-xs font-bold rounded-xl"
            >
              Create blueprint
            </button>

            {generatedBlueprint && (
              <div className="space-y-3 pt-3 border-t border-[var(--line)]">
                <pre className="p-3 bg-[var(--inbg)] border border-[var(--line)] rounded-xl text-xs font-mono whitespace-pre-wrap text-[var(--fg)] overflow-x-auto max-h-56">
                  {generatedBlueprint}
                </pre>
                <button
                  onClick={async () => {
                    await copyToClipboard(generatedBlueprint);
                    addToast('Blueprint copied to clipboard');
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-[var(--line)] text-[var(--fg)] hover:border-[var(--mut2)] flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy blueprint
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRODUCT MODAL: LIDBRIDGE */}
      {activeModal === 'lidbridge' && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-lg bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-[var(--line)]">
              <h3 className="font-bold text-base text-[var(--fg)]">LidBridge</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-[var(--mut2)] hover:text-[var(--fg)]"
              >
                ✕
              </button>
            </div>
            {state.conn.github ? (
              <div className="space-y-4">
                <p className="text-sm text-[var(--mut)]">
                  Linked as <b>@{state.conn.github}</b>. Recent synchronized commits:
                </p>
                <div className="divide-y divide-[var(--line)] text-sm">
                  {[
                    ['api-server', 'Fix auth callback redirect', '2 hours ago'],
                    ['web-client', 'Implement theme and density switches', 'Yesterday'],
                    ['docs', 'Update deployment guidelines', '3 days ago'],
                  ].map(([repo, msg, time], i) => (
                    <div key={i} className="py-2.5 flex justify-between items-center">
                      <div>
                        <b className="font-bold text-[var(--fg)] block">{repo}</b>
                        <small className="text-xs text-[var(--mut2)]">{msg}</small>
                      </div>
                      <span className="text-xs text-[var(--mut2)]">{time}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 flex justify-between items-center border-t border-[var(--line)]">
                  <button
                    onClick={() => {
                      const prevVal = state.conn.github;
                      saveState((prev) => ({ ...prev, conn: { ...prev.conn, github: '' } }));
                      setActiveModal(null);
                      addToast('GitHub disconnected', false, () => {
                        saveState((prev) => ({ ...prev, conn: { ...prev.conn, github: prevVal } }));
                      });
                    }}
                    className="text-xs font-bold text-[var(--bad)] hover:underline"
                  >
                    Unlink
                  </button>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-1.5 text-xs font-semibold rounded-xl border border-[var(--line)] text-[var(--fg)]"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center space-y-3">
                <p className="text-sm text-[var(--mut2)]">
                  Link your GitHub account to view real-time commit push streams.
                </p>
                <button
                  onClick={() => {
                    setActiveModal('github');
                  }}
                  className="px-4 py-2 bg-[var(--brand)] text-white text-xs font-bold rounded-xl"
                >
                  Link GitHub
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TRANSCRIPT MODAL */}
      {activeModal === 'transcript' && modalData && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-lg bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-[var(--line)]">
              <h3 className="font-bold text-base text-[var(--fg)]">Ticket transcript</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-[var(--mut2)] hover:text-[var(--fg)]"
              >
                ✕
              </button>
            </div>
            <textarea
              readOnly
              rows={10}
              value={modalData.transcript}
              className="w-full p-3 font-mono text-xs rounded-xl border border-[var(--line)] bg-[var(--inbg)] text-[var(--fg)] resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={async () => {
                  await copyToClipboard(modalData.transcript);
                  addToast('Transcript copied to clipboard');
                }}
                className="px-4 py-2 bg-[var(--brand)] text-white text-xs font-bold rounded-xl"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT JSON MODAL */}
      {activeModal === 'exportJson' && modalData && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-xl bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-[var(--line)]">
              <h3 className="font-bold text-base text-[var(--fg)]">Your data export</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-[var(--mut2)] hover:text-[var(--fg)]"
              >
                ✕
              </button>
            </div>
            <textarea
              readOnly
              rows={12}
              value={modalData.exportJson}
              className="w-full p-3 font-mono text-xs rounded-xl border border-[var(--line)] bg-[var(--inbg)] text-[var(--fg)] resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={async () => {
                  await copyToClipboard(modalData.exportJson);
                  addToast('Data export JSON copied');
                }}
                className="px-4 py-2 bg-[var(--brand)] text-white text-xs font-bold rounded-xl"
              >
                Copy JSON
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET DEMO DATA MODAL */}
      {activeModal === 'resetData' && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-md bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-base text-[var(--fg)]">Reset demo data?</h3>
            <p className="text-sm text-[var(--mut)]">
              This will restore every sample value, preference, ticket, and score metric.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--line)]">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-[var(--fg)]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const fresh = getDefaultState();
                  setState(fresh);
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
                  setActiveModal(null);
                  addToast('Demo data restored');
                }}
                className="px-4 py-2 bg-[var(--brand)] text-white text-xs font-bold rounded-xl"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      {activeModal === 'deleteAccount' && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-md bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-base text-[var(--bad)]">Delete account</h3>
            <p className="text-sm text-[var(--mut)]">
              Type <b>{state.user.username}</b> to confirm deletion. (This is a prototype simulation).
            </p>
            <input
              type="text"
              id="deleteConfirmInput"
              placeholder={state.user.username}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--inbg)] text-[var(--fg)] text-sm outline-none focus:border-[var(--brand)]"
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--line)]">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-[var(--fg)]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const input = document.getElementById('deleteConfirmInput') as HTMLInputElement;
                  if (input && input.value.trim() === state.user.username) {
                    saveState((prev) => ({ ...prev, out: 'deleted' }));
                    setActiveModal(null);
                  } else {
                    addToast('That username does not match.', true);
                  }
                }}
                className="px-4 py-2 bg-[var(--bad)] text-white text-xs font-bold rounded-xl"
              >
                Delete account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVITY DRAWER MODAL */}
      {activeModal === 'activityDrawer' && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-end"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-md bg-[var(--card)] h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-[var(--line)] mb-4">
                <h3 className="font-bold text-base text-[var(--fg)]">Activity timeline</h3>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-[var(--mut2)] hover:text-[var(--fg)]"
                >
                  ✕
                </button>
              </div>
              <ActivitySection activityList={state.activity} />
            </div>
          </div>
        </div>
      )}

      {/* TOASTS CONTAINER */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-4 py-2.5 rounded-xl shadow-xl text-xs font-bold flex items-center gap-3 animate-fade-in ${
              toast.bad ? 'bg-[var(--bad)] text-white' : 'bg-[var(--fg)] text-[var(--bg)]'
            }`}
          >
            <span>{toast.message}</span>
            {toast.undo && (
              <button
                onClick={() => {
                  toast.undo?.();
                  setToasts((prev) => prev.filter((t) => t.id !== toast.id));
                }}
                className="underline font-black hover:opacity-85 text-xs ml-1"
              >
                {toast.undoLabel || 'Undo'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PersonalAccountPage;
