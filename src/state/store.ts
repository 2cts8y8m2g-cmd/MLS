import { useSyncExternalStore } from 'react';
import { emptyState, sanitizeState, type AppState } from './model';

/**
 * Tiny persistent store. Progress lives in this browser's localStorage; every
 * access is guarded so private mode or blocked storage degrades to in-memory use.
 */
const KEY = 'memorylab:v1';

function load(): AppState {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? sanitizeState(JSON.parse(raw)) : emptyState();
  } catch {
    return emptyState();
  }
}

let state: AppState = typeof window === 'undefined' ? emptyState() : load();
let storageOk = true;
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function persist() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 250);
}

export function flush() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
    storageOk = true;
  } catch {
    storageOk = false;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flush);
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      state = load();
      listeners.forEach((l) => l());
    }
  });
}

export function getState() {
  return state;
}

export function update(fn: (s: AppState) => AppState) {
  const next = fn(state);
  if (next === state) return;
  state = next;
  listeners.forEach((l) => l());
  persist();
}

export function replaceState(next: AppState) {
  state = sanitizeState(next);
  listeners.forEach((l) => l());
  flush();
}

export function isStorageAvailable() {
  return storageOk;
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getState, getState);
}
