import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { ROOT, loadContent } from '../scripts/load-content';
import { bankAttempt, buildSession, chapterStats, filterBank, isBankAttempt, shuffle } from '../src/logic/bank';
import { recommend } from '../src/logic/recommend';
import { emptyState } from '../src/state/model';
import type { QuestionBank } from '../src/schema/types';

const bank = JSON.parse(readFileSync(`${ROOT}/content/question-bank/reviewer-simulator.json`, 'utf8')) as QuestionBank;
const { reviewer, curriculum, lessons } = loadContent();
const flags = JSON.parse(readFileSync(`${ROOT}/content/reviewer-review.json`, 'utf8')).flags as { id: string }[];

describe('reviewer question bank (imported)', () => {
  it('has every question the reviewer lists, with unique ids in book order', () => {
    expect(bank.count).toBe(bank.questions.length);
    expect(bank.questions.length).toBe(reviewer.chapters.reduce((n, c) => n + c.counts.simulatorQuestions, 0));
    expect(new Set(bank.questions.map((q) => q.id)).size).toBe(bank.questions.length);
    bank.questions.forEach((q, i) => expect(q.number).toBe(i + 1));
  });
  it('per-chapter counts match the reviewer inventory', () => {
    for (const c of reviewer.chapters) expect(bank.questions.filter((q) => q.chapter === c.n).length, `Ch. ${c.n}`).toBe(c.counts.simulatorQuestions);
  });
  it('every question has a stem, four options, a valid answer and an explanation', () => {
    for (const q of bank.questions) {
      expect(q.stem.length, q.id).toBeGreaterThan(10);
      expect(q.options.map((o) => o.id)).toEqual(['a', 'b', 'c', 'd']);
      expect(q.options.every((o) => o.text.length > 0)).toBe(true);
      expect(['a', 'b', 'c', 'd']).toContain(q.answer);
      expect(q.explanation.length, q.id).toBeGreaterThan(10);
    }
  });
  it('maps each question to a real domain and topic for its chapter', () => {
    const topics = new Map(curriculum.domains.flatMap((d) => d.topics.map((t) => [t.id, { d: d.id, ch: t.reviewerChapter }])));
    for (const q of bank.questions) {
      expect(topics.get(q.topic), q.id).toEqual({ d: q.domain, ch: q.chapter });
    }
  });
  it('states provenance, permission and that it is unverified', () => {
    expect(bank.permission).toMatch(/hold the rights/);
    expect(bank.verification).toMatch(/not been verified/);
  });
  it('notes point at real register flags', () => {
    const ids = new Set(flags.map((f) => f.id));
    for (const q of bank.questions) for (const n of q.notes) expect(ids.has(n.flagId), `${q.id} → ${n.flagId}`).toBe(true);
  });
});

describe('question-bank logic', () => {
  const ch3 = bank.questions.filter((q) => q.chapter === 3);
  it('filters by chapter and pool', () => {
    expect(filterBank(bank, { chapter: 3 }, []).length).toBe(ch3.length);
    const wrong = bankAttempt(bank, ch3[0], ch3[0].answer === 'a' ? 'b' : 'a', 'x', '2026-01-01T00:00:00Z');
    expect(wrong.correct).toBe(false);
    expect(isBankAttempt(wrong)).toBe(true);
    expect(filterBank(bank, { chapter: 3, pool: 'missed' }, [wrong]).map((q) => q.id)).toEqual([ch3[0].id]);
    expect(filterBank(bank, { chapter: 3, pool: 'new' }, [wrong]).length).toBe(ch3.length - 1);
    const right = { ...bankAttempt(bank, ch3[0], ch3[0].answer, 'x', '2026-01-02T00:00:00Z') };
    expect(filterBank(bank, { chapter: 3, pool: 'missed' }, [wrong, right]).length).toBe(0);
  });
  it('builds deterministic sessions of the requested size', () => {
    const a = buildSession(bank, {}, [], 20, 42).map((q) => q.id);
    expect(a.length).toBe(20);
    expect(buildSession(bank, {}, [], 20, 42).map((q) => q.id)).toEqual(a);
    expect(new Set(shuffle([1, 2, 3, 4, 5], 7))).toEqual(new Set([1, 2, 3, 4, 5]));
  });
  it('chapter stats use the latest answer per question', () => {
    const q = ch3[0];
    const s = chapterStats(bank, [bankAttempt(bank, q, 'z', 'x', '2026-01-01T00:00:00Z'), bankAttempt(bank, q, q.answer, 'x', '2026-01-02T00:00:00Z')]).get(3)!;
    expect(s).toEqual({ total: ch3.length, answered: 1, correct: 1 });
  });
  it('missed bank questions recommend lessons for the same chapter, never a bank pseudo-lesson', () => {
    const state = { ...emptyState(), attempts: [bankAttempt(bank, ch3[0], 'z', `Ch. 3 · x`, '2026-01-01T00:00:00Z')] };
    const recs = recommend(curriculum, lessons, state);
    expect(recs.some((r) => r.lessonId.startsWith('bank:'))).toBe(false);
    const ch3Lessons = new Set(lessons.filter((l) => l.lesson.topic === 'ch3').map((l) => l.lesson.id));
    expect(recs[0].kind).toBe('review-weak');
    expect(ch3Lessons.has(recs[0].lessonId)).toBe(true);
  });
});
