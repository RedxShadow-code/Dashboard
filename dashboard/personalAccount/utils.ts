import { DashboardState, ScoreItem } from './types';
import { LEVELS, DAY, MIN } from './constants';

export const ago = (ts: number): string => {
  const s = (Date.now() - ts) / 1000;
  if (s < 45) return 'Just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} ${m === 1 ? 'minute' : 'minutes'} ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} ${h === 1 ? 'hour' : 'hours'} ago`;
  const d = Math.round(h / 24);
  if (d === 1) return 'Yesterday';
  if (d < 14) return `${d} days ago`;
  return `${Math.round(d / 7)} weeks ago`;
};

export const formatRelativeTime = (iso?: string): string => {
  if (!iso) return 'Just now';
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

export const dayKey = (ts: number = Date.now()): string => {
  const d = new Date(ts);
  const z = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};

export const localDay = (ts: number): number => {
  return Math.floor((ts - new Date(ts).getTimezoneOffset() * MIN) / DAY);
};

export const scoreItems = (state: DashboardState): ScoreItem[] => {
  const age = Math.floor((Date.now() - state.pwChanged) / DAY);
  return [
    { k: 'base', l: 'Account created', pts: 40, on: true },
    {
      k: 'twofa',
      l: 'Two-factor authentication',
      pts: 20,
      on: state.twofa,
      do: 'Turn on two-factor',
      btn: 'Turn on two-factor',
      cta: 'Turn on',
      act: 'on2fa',
      why: 'It adds a second check every time you sign in.',
    },
    {
      k: 'email',
      l: 'Email verified',
      pts: 15,
      on: state.user.verified,
      do: 'Verify your email',
      btn: 'Verify email',
      cta: 'Verify',
      act: 'verify',
      why: 'It lets us help you if you ever lose access.',
    },
    {
      k: 'pw',
      l: 'Password changed in the last 90 days',
      pts: 10,
      on: age < 90,
      do: 'Change your password',
      btn: 'Change password',
      cta: 'Change',
      act: 'pwgo',
      why: 'A fresh password is harder to guess or reuse.',
    },
    {
      k: 'dev',
      l: 'Two or fewer signed-in devices',
      pts: 10,
      on: state.sessions.length <= 2,
      do: 'Review your signed-in devices',
      btn: 'Review devices',
      cta: 'Review',
      act: 'devgo',
      why: 'Signing out devices you no longer use cuts risk.',
    },
    {
      k: 'bk',
      l: 'Backup email added',
      pts: 5,
      on: !!state.user.backup,
      do: 'Add a backup email',
      btn: 'Add backup email',
      cta: 'Add',
      act: 'backup',
      why: 'It gives you another way back into your account.',
    },
  ];
};

export const computeSecurityScore = (state: DashboardState): number => {
  return scoreItems(state).reduce((acc, item) => acc + (item.on ? item.pts : 0), 0);
};

export const getNextSecurityStep = (state: DashboardState): ScoreItem | undefined => {
  return scoreItems(state)
    .filter((i) => !i.on)
    .sort((a, b) => b.pts - a.pts)[0];
};

export const calculateLevel = (points: number): number => {
  return Math.min(Math.floor(points / 100), LEVELS.length - 1);
};

export interface SeriesPoint {
  d: number;
  dow: number;
  v: number;
}

export const generateActivitySeries = (
  range: number,
  actDate: string,
  actCount: number
): SeriesPoint[] => {
  const out: SeriesPoint[] = [];
  const base = localDay(Date.now());
  for (let k = range - 1; k >= 0; k--) {
    const d = base - k;
    const dow = new Date(d * DAY).getUTCDay();
    const v =
      16 +
      ((d * 37) % 23) +
      (dow === 0 || dow === 6 ? 0 : 10) +
      (dow === 5 ? 14 : 0);
    out.push({ d, dow, v });
  }
  if (actDate === dayKey()) {
    out[out.length - 1].v += actCount;
  }
  return out;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (e) {
      document.body.removeChild(textArea);
      return false;
    }
  }
};
