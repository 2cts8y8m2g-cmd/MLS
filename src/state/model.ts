import type { TrackId } from '../schema/types';

export type TrackChoice = TrackId | 'both';

export interface Settings {
  track: TrackChoice;
  reducedMotion: 'system' | 'on' | 'off';
  narration: boolean;
  captions: boolean;
  captionSize: 'm' | 'l' | 'xl';
  theme: 'system' | 'light' | 'dark';
  rate: number;
}

export interface LessonProgress {
  lastT: number;
  scenesSeen: string[];
  watched: boolean;
  watchedAt?: string;
  updatedAt: string;
}

export interface Attempt {
  qid: string;
  lessonId: string;
  skill: string;
  domain: string;
  topic: string;
  choice: string;
  correct: boolean;
  at: string;
}

export interface Bookmark {
  lessonId: string;
  sceneId?: string;
  t?: number;
  label: string;
  at: string;
}

export interface AppState {
  version: 1;
  settings: Settings;
  lessons: Record<string, LessonProgress>;
  attempts: Attempt[];
  bookmarks: Bookmark[];
}

export const DEFAULT_SETTINGS: Settings = {
  track: 'both',
  reducedMotion: 'system',
  narration: false,
  captions: true,
  captionSize: 'm',
  theme: 'system',
  rate: 1,
};

export const emptyState = (): AppState => ({
  version: 1,
  settings: { ...DEFAULT_SETTINGS },
  lessons: {},
  attempts: [],
  bookmarks: [],
});

/** Accepts anything (e.g. corrupted storage or an imported file) and returns a valid state. */
export function sanitizeState(raw: unknown): AppState {
  const base = emptyState();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<AppState>;
  if (r.version !== 1) return base;
  const s = { ...base.settings, ...(r.settings ?? {}) };
  if (!['ascp', 'mtle', 'both'].includes(s.track)) s.track = 'both';
  if (!['system', 'on', 'off'].includes(s.reducedMotion)) s.reducedMotion = 'system';
  if (!['m', 'l', 'xl'].includes(s.captionSize)) s.captionSize = 'm';
  if (!['system', 'light', 'dark'].includes(s.theme)) s.theme = 'system';
  if (typeof s.rate !== 'number' || s.rate < 0.5 || s.rate > 2) s.rate = 1;
  s.narration = !!s.narration;
  s.captions = s.captions !== false;
  const lessons: AppState['lessons'] = {};
  if (r.lessons && typeof r.lessons === 'object')
    for (const [k, v] of Object.entries(r.lessons))
      if (v && typeof v === 'object' && typeof v.lastT === 'number')
        lessons[k] = { lastT: v.lastT, scenesSeen: Array.isArray(v.scenesSeen) ? v.scenesSeen.map(String) : [], watched: !!v.watched, watchedAt: v.watchedAt, updatedAt: String(v.updatedAt ?? '') };
  const attempts = Array.isArray(r.attempts)
    ? r.attempts.filter((a): a is Attempt => !!a && typeof a.qid === 'string' && typeof a.correct === 'boolean' && typeof a.lessonId === 'string')
    : [];
  const bookmarks = Array.isArray(r.bookmarks)
    ? r.bookmarks.filter((b): b is Bookmark => !!b && typeof b.lessonId === 'string' && typeof b.label === 'string')
    : [];
  return { version: 1, settings: s, lessons, attempts, bookmarks };
}

const now = () => new Date().toISOString();

export function recordPosition(state: AppState, lessonId: string, t: number, sceneId: string): AppState {
  const prev = state.lessons[lessonId] ?? { lastT: 0, scenesSeen: [], watched: false, updatedAt: '' };
  const scenesSeen = prev.scenesSeen.includes(sceneId) ? prev.scenesSeen : [...prev.scenesSeen, sceneId];
  if (prev.lastT === t && scenesSeen === prev.scenesSeen) return state;
  return { ...state, lessons: { ...state.lessons, [lessonId]: { ...prev, lastT: t, scenesSeen, updatedAt: now() } } };
}

export function markWatched(state: AppState, lessonId: string): AppState {
  const prev = state.lessons[lessonId] ?? { lastT: 0, scenesSeen: [], watched: false, updatedAt: '' };
  if (prev.watched) return state;
  return { ...state, lessons: { ...state.lessons, [lessonId]: { ...prev, watched: true, watchedAt: now(), updatedAt: now() } } };
}

export function addAttempts(state: AppState, attempts: Attempt[]): AppState {
  return { ...state, attempts: [...state.attempts, ...attempts].slice(-5000) };
}

export function bookmarkKey(b: Pick<Bookmark, 'lessonId' | 'sceneId'>) {
  return `${b.lessonId}#${b.sceneId ?? ''}`;
}

export function toggleBookmark(state: AppState, b: Omit<Bookmark, 'at'>): AppState {
  const key = bookmarkKey(b);
  const exists = state.bookmarks.some((x) => bookmarkKey(x) === key);
  return {
    ...state,
    bookmarks: exists ? state.bookmarks.filter((x) => bookmarkKey(x) !== key) : [...state.bookmarks, { ...b, at: now() }],
  };
}

export function isBookmarked(state: AppState, lessonId: string, sceneId?: string) {
  const key = bookmarkKey({ lessonId, sceneId });
  return state.bookmarks.some((x) => bookmarkKey(x) === key);
}
