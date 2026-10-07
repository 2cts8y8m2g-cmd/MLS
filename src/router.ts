import { useEffect, useState } from 'react';

/** Minimal hash router: works on any static host with no server configuration. */
export function parseHash(hash: string): { path: string[]; query: URLSearchParams } {
  const raw = hash.replace(/^#/, '') || '/';
  const [p, q = ''] = raw.split('?');
  return { path: p.split('/').filter(Boolean).map(decodeURIComponent), query: new URLSearchParams(q) };
}

export function useRoute() {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return parseHash(hash);
}

export const href = (path: string) => `#${path}`;
export function navigate(path: string) {
  window.location.hash = path;
}
