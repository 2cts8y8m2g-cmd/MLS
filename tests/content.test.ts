import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { loadContent, ROOT } from '../scripts/load-content';

const { lessons, tracks, reviewer, curriculum } = loadContent();
const review = JSON.parse(readFileSync(`${ROOT}/content/reviewer-review.json`, 'utf8')) as { flags: { id: string; status: string; location: { chapter: number }; evidence: unknown[] }[] };

describe('content integrity', () => {
  it('every lesson file is structurally valid', () => {
    for (const l of lessons) expect(l.validation.errors, l.file).toEqual([]);
  });
  it('lesson file names match lesson ids', () => {
    for (const l of lessons) expect(l.file).toBe(`${l.lesson.id}.json`);
  });
  it('no lesson claims human expert review (none has occurred)', () => {
    for (const l of lessons) expect(l.lesson.verification.humanExpertReview).toBe(false);
  });
  it('the reviewer is received and every reviewer chapter is inventoried', () => {
    expect(reviewer.received).toBe(true);
    expect(reviewer.chapters.map((c) => c.n)).toEqual(Array.from({ length: 79 }, (_, i) => i + 1));
    expect(reviewer.chapters.every((c) => c.status !== 'not-started')).toBe(true);
  });
  it('curriculum is reviewer-derived: one topic per chapter, each with a core concept', () => {
    expect(curriculum.provenance.status).toBe('reviewer-derived');
    const topics = curriculum.domains.flatMap((d) => d.topics).filter((t) => t.reviewerChapter);
    expect(topics.map((t) => t.reviewerChapter)).toEqual(Array.from({ length: 79 }, (_, i) => i + 1));
    for (const t of topics) expect(t.concepts.filter((k) => k.kind === 'core')).toHaveLength(1);
  });
  it('concept counts match the reviewer inventory (hits, tables, figures, traps)', () => {
    for (const ch of reviewer.chapters) {
      const t = curriculum.domains.flatMap((d) => d.topics).find((x) => x.reviewerChapter === ch.n)!;
      const n = (k: string) => t.concepts.filter((c) => c.kind === k).length;
      expect(n('core') + n('hit')).toBe(ch.counts.highYield);
      expect(n('table')).toBe(ch.counts.tables);
      expect(n('figure')).toBe(ch.counts.figures);
      expect(n('trap')).toBe(ch.counts.traps);
    }
  });
  it('reviewer concepts carry locators; gap concepts are explicitly not in the reviewer', () => {
    for (const d of curriculum.domains)
      for (const t of d.topics)
        for (const k of t.concepts) {
          if (k.kind === 'gap') expect(k.reviewerRef).toBeNull();
          else expect(k.reviewerRef?.chapter).toBe(t.reviewerChapter);
        }
  });
  it('committed inventory holds labels only, not reviewer passages', () => {
    for (const d of curriculum.domains) for (const t of d.topics) for (const k of t.concepts) expect(k.title.length, k.id).toBeLessThanOrEqual(130);
  });
  it('every lesson is mapped to reviewer locations that exist', () => {
    for (const l of lessons) {
      expect(l.lesson.reviewer.status).toBe('mapped');
      for (const loc of l.lesson.reviewer.locations) expect(loc.chapter >= 1 && loc.chapter <= 79).toBe(true);
    }
  });
  it('reviewer accuracy flags point at real chapters and verified issues cite evidence', () => {
    for (const f of review.flags) {
      expect(f.location.chapter >= 0 && f.location.chapter <= 79, f.id).toBe(true);
      if (f.status === 'verified-issue') expect(f.evidence.length, f.id).toBeGreaterThan(0);
    }
  });
  it('track areas reference real domains', () => {
    const ids = new Set(curriculum.domains.map((d) => d.id));
    for (const t of tracks) for (const a of t.areas) for (const d of a.domains) expect(ids.has(d), `${t.id}: ${d}`).toBe(true);
  });
  it('MTLE weights from R.A. 5527 sum to 100%', () => {
    const m = tracks.find((t) => t.id === 'mtle')!;
    expect(m.areas.reduce((a, x) => a + parseInt(x.weight, 10), 0)).toBe(100);
  });
});
