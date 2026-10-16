export type SectionId =
  | 'dashboard'
  | 'products'
  | 'security'
  | 'notifications'
  | 'support'
  | 'open_ticket'
  | 'faq'
  | 'feedback'
  | 'settings'
  | 'rewards'
  | 'activity';

export type ProductKey = 'leakshield' | 'repoprep' | 'idea2project' | 'lidbridge';

export type StatusKey = 'active' | 'linked' | 'not_linked' | 'hidden' | 'paused';

export interface UserProfile {
  display: string;
  name: string;
  username: string;
  email: string;
  backup: string;
  birth: string;
  verified: boolean;
  color: string;
}

export interface SessionDevice {
  id: number;
  device: string;
  ts: number;
  cur: boolean;
  location?: string;
}

export type NotificationType = 'security' | 'update' | 'announce';

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  text: string;
  ts: number;
  read: boolean;
  prod?: ProductKey | string;
  email?: boolean;
}

export type TicketCategory = 'Account' | 'Product' | 'Billing' | 'Other';
export type TicketStatus = 'Open' | 'In progress' | 'Resolved';

export interface TicketMessage {
  f: 'me' | 'support';
  t: string;
  ts: number;
}

export interface SupportTicket {
  id: number;
  subject: string;
  cat: TicketCategory;
  status: TicketStatus;
  ts: number;
  opened: number;
  msgs: TicketMessage[];
}

export type FeedbackType = 'Idea' | 'Bug' | 'Request';
export type FeedbackStatus = 'Received' | 'In review' | 'Responded';

export interface FeedbackItem {
  id: number;
  type: FeedbackType;
  title: string;
  status: FeedbackStatus;
  details?: string;
  ts?: number;
}

export interface ActivityEntry {
  t: string;
  ts: number;
}

export interface ProductNotificationPref {
  email: boolean;
  inapp: boolean;
  browser: boolean;
  mute: number; // 0 for unmuted, -1 for indefinite, timestamp for timed mute
}

export type ProductNotificationMap = Record<ProductKey, ProductNotificationPref>;

export interface EmailPrefs {
  login: boolean;
  password: boolean;
  devices: boolean;
  product: boolean;
  offers: boolean;
}

export interface AppStats {
  scans: number;
  repos: number;
  projects: number;
  pushes: number;
}

export interface ScanResult {
  ts: number;
  found: number;
}

export interface ScoreItem {
  k: string;
  l: string;
  pts: number;
  on: boolean;
  do?: string;
  btn?: string;
  cta?: string;
  act?: string;
  why?: string;
}

export type SettingsTab = 'general' | 'identity' | 'apps' | 'prefs' | 'export' | 'danger';
export type SecurityTab = 'account' | 'password' | 'history';
export type NotifTab = 'inbox' | 'prefs';
export type ThemeMode = 'dark' | 'light' | 'system';
export type LayoutDensity = 'comfortable' | 'compact';
export type NetworkSim = 'normal' | 'slow' | 'offline';

export interface DashboardState {
  route: string;
  out: 'out' | 'deleted' | null;
  theme: ThemeMode;
  user: UserProfile;
  unameChanges: number[];
  twofa: boolean;
  codes: string[];
  pwChanged: number;
  pwCode: string;
  sessions: SessionDevice[];
  notifs: AppNotification[];
  prefs: EmailPrefs;
  browser: boolean;
  stats: AppStats;
  fav: Record<string, boolean>;
  apps: Record<string, boolean>;
  conn: {
    github: string;
    discord: string;
  };
  tickets: SupportTicket[];
  nextTicket: number;
  feedback: FeedbackItem[];
  points: number;
  awarded: Record<string, number>;
  checkin: string;
  activity: ActivityEntry[];
  tab: {
    security: SecurityTab;
    settings: SettingsTab;
    notif: string;
    notifp: NotifTab;
  };
  pp: ProductNotificationMap;
  onboard: 'show' | 'hidden';
  density: LayoutDensity;
  motion: boolean;
  hoverTabs: boolean;
  streak: number;
  actDate: string;
  actCount: number;
  range: 7 | 30;
  scans: ScanResult[];
}
