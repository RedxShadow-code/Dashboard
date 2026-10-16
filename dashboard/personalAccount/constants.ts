import { DashboardState, ProductNotificationMap, ProductKey } from './types';

export const STORAGE_KEY = 'lidprex-proto-v5';

export const DAY = 864e5;
export const HR = 36e5;
export const MIN = 6e4;

export const defaultPP = (): ProductNotificationMap => ({
  leakshield: { email: true, inapp: true, browser: false, mute: 0 },
  repoprep: { email: true, inapp: true, browser: false, mute: 0 },
  idea2project: { email: true, inapp: true, browser: false, mute: 0 },
  lidbridge: { email: true, inapp: true, browser: false, mute: 0 },
});

export const LEVELS = ['Explorer', 'Builder', 'Maker', 'Pioneer', 'Legend'];

export const PROD_INFO: Record<
  ProductKey,
  { name: string; desc: string; metric: string; getValue: (stats: DashboardState['stats'], conn: DashboardState['conn']) => string }
> = {
  leakshield: {
    name: 'LeakShield',
    desc: 'Security workflows are live',
    metric: 'Scans this week',
    getValue: (stats) => `${stats.scans}`,
  },
  repoprep: {
    name: 'RepoPrep',
    desc: 'Upcoming tooling updates',
    metric: 'Repos cleaned',
    getValue: (stats) => `${stats.repos}`,
  },
  idea2project: {
    name: 'Idea2Project',
    desc: 'Blueprints are available',
    metric: 'Projects',
    getValue: (stats) => `${stats.projects}`,
  },
  lidbridge: {
    name: 'LidBridge',
    desc: 'Link GitHub to track your pushes',
    metric: 'Push activity',
    getValue: (stats, conn) => (conn.github ? `${stats.pushes} pushes` : 'Paused'),
  },
};

export const FAQ_DATA = [
  {
    q: 'How do I change my display name or username?',
    a: [
      'Open Settings, then General, to update your personal information.',
      'You can change your username twice every 7 days.',
    ],
    l: ['Go to Settings', 'settings'],
  },
  {
    q: 'How can I update my profile picture?',
    a: ['In Settings, choose Change photo and pick a color for your avatar.'],
    l: ['Change photo', 'photo'],
  },
  {
    q: 'Where can I change my password or email?',
    a: [
      'Change your password under Security, then Password. Email verification lives in Settings, under Identity and verification.',
    ],
    l: ['Open Security', 'security'],
  },
  {
    q: 'How do I link my GitHub account?',
    a: [
      'Open LidBridge from Products, or use Connected accounts in Settings. You only need your GitHub username here.',
    ],
    l: ['Link GitHub', 'github'],
  },
  {
    q: 'How do I manage notifications?',
    a: ['Use the toggles on the Notifications page to choose which alerts you get by email.'],
    l: ['Open Notifications', 'notifications'],
  },
  {
    q: 'How do I delete my account?',
    a: ['Open Settings, then Danger zone. You will be asked to type your username to confirm.'],
    l: ['Open Danger zone', 'danger'],
  },
];

export const getDefaultState = (): DashboardState => {
  const n = Date.now();
  return {
    route: 'dashboard',
    out: null,
    theme: 'dark',
    user: {
      display: 'Alex',
      name: 'Alex Morgan',
      username: 'alex',
      email: 'alex@lid.io',
      backup: '',
      birth: '',
      verified: false,
      color: '',
    },
    unameChanges: [],
    twofa: true,
    codes: [
      '4F9K-2M7Q',
      'T8WD-1X5B',
      'H3ZP-9C6N',
      'R7LA-4E2V',
      'Y5BG-8J3S',
      'C2QN-6U9D',
      'M9XT-3K1H',
      'V6SE-7P4F',
    ],
    pwChanged: n - 40 * DAY,
    pwCode: '',
    sessions: [
      { id: 1, device: 'Chrome on Windows', ts: n, cur: true, location: 'San Francisco, US' },
      { id: 2, device: 'Safari on iPhone', ts: n - DAY, cur: false, location: 'Cupertino, US' },
      { id: 3, device: 'Firefox on Linux', ts: n - 3 * DAY, cur: false, location: 'London, UK' },
      { id: 4, device: 'Chrome on Android', ts: n - 7 * DAY, cur: false, location: 'Austin, US' },
    ],
    notifs: [
      {
        id: 1,
        type: 'security',
        title: 'Security alert',
        text: 'New login detected on your account.',
        ts: n - 10 * MIN,
        read: false,
      },
      {
        id: 2,
        type: 'update',
        title: 'RepoPrep update',
        text: 'New cleanup filters are live.',
        ts: n - 2 * HR,
        read: false,
        prod: 'repoprep',
        email: true,
      },
      {
        id: 3,
        type: 'announce',
        title: 'Lidprex announcement',
        text: 'Improved personal dashboard experience.',
        ts: n - DAY,
        read: true,
      },
      {
        id: 4,
        type: 'security',
        title: 'LeakShield',
        text: 'Scan queue delay detected.',
        ts: n - 3 * DAY,
        read: true,
        prod: 'leakshield',
        email: true,
      },
    ],
    prefs: { login: true, password: true, devices: true, product: true, offers: false },
    browser: false,
    stats: { scans: 12, repos: 5, projects: 8, pushes: 14 },
    fav: {},
    apps: { leakshield: true, repoprep: true, idea2project: true, lidbridge: true },
    conn: { github: '', discord: 'alex#2041' },
    tickets: [
      {
        id: 1042,
        subject: 'Login alerts not arriving',
        cat: 'Account',
        status: 'In progress',
        ts: n - 3 * HR,
        opened: n - 2 * DAY,
        msgs: [
          { f: 'support', t: 'Thanks Alex, we are checking your alert settings now.', ts: n - 2 * DAY },
          { f: 'me', t: 'I only get emails, not the bell notification.', ts: n - DAY },
          {
            f: 'support',
            t: 'Fixed on our side. Try a new login and tell us if the alert arrives.',
            ts: n - 3 * HR,
          },
        ],
      },
      {
        id: 1038,
        subject: 'Update my display name',
        cat: 'Account',
        status: 'Resolved',
        ts: n - 2 * DAY,
        opened: n - 4 * DAY,
        msgs: [
          { f: 'me', t: 'How do I change my display name?', ts: n - 4 * DAY },
          { f: 'support', t: 'Open Settings, then General. You can edit it there.', ts: n - 2 * DAY },
        ],
      },
      {
        id: 1031,
        subject: 'Invoice for last month',
        cat: 'Billing',
        status: 'Resolved',
        ts: n - 7 * DAY,
        opened: n - 9 * DAY,
        msgs: [
          { f: 'me', t: "Can I get last month's invoice?", ts: n - 9 * DAY },
          { f: 'support', t: 'Sent to your email. Let us know if it did not arrive.', ts: n - 7 * DAY },
        ],
      },
    ],
    nextTicket: 1043,
    feedback: [
      { id: 1, type: 'Idea', title: 'Offline mode', status: 'In review' },
      { id: 2, type: 'Request', title: 'Daily stats board', status: 'Responded' },
    ],
    points: 65,
    awarded: {},
    checkin: '',
    activity: [
      { t: 'Viewed LeakShield updates', ts: n - HR },
      { t: 'Saved Idea2Project to favorites', ts: n - DAY },
      { t: 'Opened RepoPrep dashboard', ts: n - 4 * DAY },
    ],
    tab: {
      security: 'account',
      settings: 'general',
      notif: 'all',
      notifp: 'inbox',
    },
    pp: defaultPP(),
    onboard: 'show',
    density: 'comfortable',
    motion: true,
    hoverTabs: true,
    streak: 0,
    actDate: '',
    actCount: 0,
    range: 7,
    scans: [
      { ts: n - 2 * DAY, found: 0 },
      { ts: n - 5 * DAY, found: 1 },
    ],
  };
};
