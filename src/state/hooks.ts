import { useEffect, useState } from 'react';
import { update, useAppState } from './store';
import type { Settings } from './model';

export function useSettings(): [Settings, (patch: Partial<Settings>) => void] {
  const s = useAppState().settings;
  return [s, (patch) => update((st) => ({ ...st, settings: { ...st.settings, ...patch } }))];
}

function useMedia(query: string): boolean {
  const get = () => typeof window !== 'undefined' && !!window.matchMedia?.(query).matches;
  const [m, setM] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return;
    const on = () => setM(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return m;
}

/** Resolves the reduced-motion setting against the operating-system preference. */
export function useReducedMotion(): boolean {
  const [s] = useSettings();
  const system = useMedia('(prefers-reduced-motion: reduce)');
  return s.reducedMotion === 'on' || (s.reducedMotion === 'system' && system);
}

export function useThemeEffect() {
  const [s] = useSettings();
  const reduced = useReducedMotion();
  useEffect(() => {
    const root = document.documentElement;
    if (s.theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', s.theme);
    root.toggleAttribute('data-reduced-motion', reduced);
  }, [s.theme, reduced]);
}
