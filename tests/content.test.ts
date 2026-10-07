import { describe, expect, it } from 'vitest';
import { loadContent } from '../scripts/load-content';

const { lessons, tracks, reviewer, curriculum } = loadContent();

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
  it('no lesson claims reviewer mapping while the reviewer is missing', () => {
    if (!reviewer.received) for (const l of lessons) expect(l.lesson.reviewer.status).not.toBe('mapped');
  });
  it('curriculum is labeled provisional and unmapped while the reviewer is missing', () => {
    if (!reviewer.received) {
      expect(curriculum.provenance.status).toBe('provisional');
      for (const d of curriculum.domains) for (const t of d.topics) for (const k of t.concepts) expect(k.reviewerRef).toBeNull();
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
