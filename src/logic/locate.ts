import type { ReviewerLocation } from '../schema/types';

/** "Ch. 40 · High-Yield Hits #2, #13" — the reviewer EPUB has no fixed page numbers. */
export function formatLocation(loc: ReviewerLocation): string {
  if (loc.chapter === 0) return loc.section;
  const items = loc.items?.length ? ` #${loc.items.join(', #')}` : '';
  return `Ch. ${loc.chapter} · ${loc.section}${items}`;
}

export const formatLocations = (locs: ReviewerLocation[]) => locs.map(formatLocation).join('; ');
