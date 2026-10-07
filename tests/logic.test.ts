import { describe, expect, it } from 'vitest';
import { scoreQuiz, toAttempts } from '../src/logic/quiz';
import { areaStats, weakAreas } from '../src/logic/weak';
import { recommend } from '../src/logic/recommend';
import { conceptStatus, coverage } from '../src/logic/curriculum';
import { addAttempts, emptyState, markWatched, recordPosition, sanitizeState, toggleBookmark, type Attempt } from '../src/state/model';
import { loadContent } from '../scripts/load-content';

const { lessons, curriculum } = loadContent();
const entry = lessons.find((l) => l.lesson.id === 'ih-abo-forward-reverse')!;
const lesson = entry.lesson;
const qs = lesson.questions;

const att = (qid: string, correct: boolean, at: string, skill = 's1'): Attempt => ({ qid, lessonId: lesson.id, skill, domain: 'p5-bb', topic: 'ch40', choice: correct ? 'a' : 'b', correct, at });

describe('quiz scoring', () => {
  it('scores correct, incorrect and unanswered questions', () => {
    const r = scoreQuiz(qs, { [qs[0].id]: qs[0].answer, [qs[1].id]: 'b' });
    expect(r.correct).toBe(1);
    expect(r.total).toBe(3);
    expect(r.percent).toBe(33);
    expect(r.items[2]).toEqual({ qid: qs[2].id, choice: null, correct: false });
  });
  it('scores a perfect quiz as 100%', () => {
    const all = Object.fromEntries(qs.map((q) => [q.id, q.answer]));
    expect(scoreQuiz(qs, all).percent).toBe(100);
  });
  it('creates attempts only for answered questions, tagged with skill/domain/topic', () => {
    const a = toAttempts(lesson, qs, { [qs[2].id]: qs[2].answer }, '2026-01-01T00:00:00Z');
    expect(a).toHaveLength(1);
    expect(a[0]).toMatchObject({ qid: qs[2].id, correct: true, skill: qs[2].skill, domain: 'p5-bb', topic: 'ch40' });
  });
});

describe('weak areas', () => {
  it('is empty with no attempts', () => {
    expect(weakAreas([])).toEqual([]);
  });
  it('flags a skill whose latest answer is wrong', () => {
    const w = weakAreas([att('q1', true, '1'), att('q1', false, '2')]);
    expect(w).toHaveLength(1);
    expect(w[0].missedQuestionIds).toEqual(['q1']);
  });
  it('recency weighting: recovering after a miss clears the weak flag', () => {
    const a = [att('q1', false, '1'), att('q1', true, '2'), att('q1', true, '3')];
    const s = areaStats(a, 'skill')[0];
    expect(s.accuracy).toBeCloseTo(5 / 6);
    expect(weakAreas(a)).toEqual([]);
  });
  it('sorts weakest first and groups by topic', () => {
    const a = [att('q1', false, '1', 'A'), att('q2', true, '1', 'B'), att('q3', false, '1', 'B'), att('q4', true, '1', 'B')];
    const w = weakAreas(a);
    expect(w[0].key).toBe('A');
    expect(areaStats(a, 'topic')[0].attempts).toBe(4);
  });
});

describe('progress model', () => {
  it('records position and seen scenes, then watched', () => {
    let s = recordPosition(emptyState(), 'L', 12, 'hook');
    s = recordPosition(s, 'L', 30, 'normal');
    expect(s.lessons.L.scenesSeen).toEqual(['hook', 'normal']);
    s = markWatched(s, 'L');
    expect(s.lessons.L.watched).toBe(true);
  });
  it('toggles bookmarks per lesson and per scene', () => {
    let s = toggleBookmark(emptyState(), { lessonId: 'L', label: 'x' });
    s = toggleBookmark(s, { lessonId: 'L', sceneId: 'hook', label: 'y' });
    expect(s.bookmarks).toHaveLength(2);
    s = toggleBookmark(s, { lessonId: 'L', label: 'x' });
    expect(s.bookmarks.map((b) => b.sceneId)).toEqual(['hook']);
  });
  it('sanitizes corrupted or foreign data', () => {
    expect(sanitizeState('garbage')).toEqual(emptyState());
    const s = sanitizeState({ version: 1, settings: { track: 'zzz', rate: 9 }, attempts: [{ bad: 1 }, att('q', true, '1')], lessons: { a: { lastT: 'x' } } });
    expect(s.settings.track).toBe('both');
    expect(s.settings.rate).toBe(1);
    expect(s.attempts).toHaveLength(1);
    expect(s.lessons).toEqual({});
  });
  it('round-trips through JSON (export/import)', () => {
    let s = addAttempts(emptyState(), [att('q', true, '1')]);
    s = markWatched(s, 'L');
    expect(sanitizeState(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });
});

describe('recommendations', () => {
  it('suggests lessons in reviewer order to a new learner (Ch. 1 before Ch. 40)', () => {
    const r = recommend(curriculum, lessons, emptyState());
    expect(r.map((x) => x.lessonId)).toEqual(['ops-clia-complexity-accreditation', lesson.id]);
    expect(r.every((x) => x.kind === 'next')).toBe(true);
  });
  it('moves on once a lesson is watched and its quiz attempted', () => {
    let s = markWatched(emptyState(), 'ops-clia-complexity-accreditation');
    s = addAttempts(s, [{ ...att('ops-clia-q1', true, '1'), lessonId: 'ops-clia-complexity-accreditation' }]);
    expect(recommend(curriculum, lessons, s)[0].lessonId).toBe(lesson.id);
  });
  it('prioritises weak-area review from real results', () => {
    const s = addAttempts(emptyState(), [att(qs[0].id, false, '1', qs[0].skill)]);
    expect(recommend(curriculum, lessons, s)[0].kind).toBe('review-weak');
  });
  it('suggests the quiz after watching without answering', () => {
    const s = markWatched(emptyState(), lesson.id);
    expect(recommend(curriculum, lessons, s)[0]).toMatchObject({ kind: 'quiz', lessonId: lesson.id });
  });
  it('respects the track filter', () => {
    const s = emptyState();
    s.settings.track = 'mtle';
    expect(recommend(curriculum, lessons, s).length).toBe(2); // both lessons are tagged for both tracks
  });
});

describe('coverage', () => {
  it('counts only complete lessons and separates review-needed', () => {
    const cov = coverage(curriculum, lessons);
    const bb = cov.find((d) => d.domain.id === 'p5-bb')!;
    expect(bb.complete).toBe(2); // ch40.hit2 + ch40.hit13
    expect(bb.needsReview).toBe(2);
    expect(cov.find((d) => d.domain.id === 'p1-ops')!.complete).toBe(7);
    expect(cov.reduce((a, d) => a + d.complete, 0)).toBe(9);
    expect(conceptStatus('ch40.hit2', lessons)).toBe('complete-needs-review');
    expect(conceptStatus('ch40.hit14', lessons)).toBe('pending'); // only partly taught — not counted
    expect(conceptStatus('ch31.hit1', lessons)).toBe('pending');
  });
  it('treats an incomplete lesson as a draft, not complete', () => {
    const draft = { ...entry, validation: { ...entry.validation, complete: false } };
    expect(conceptStatus('ch40.hit2', [draft])).toBe('draft');
  });
  it('filters MTLE-only domains out of the ASCP track', () => {
    const ids = coverage(curriculum, lessons, 'ascp').map((d) => d.domain.id);
    expect(ids).not.toContain('gap-histo');
    expect(ids).not.toContain('gap-ph-law');
    expect(coverage(curriculum, lessons, 'mtle').map((d) => d.domain.id)).not.toContain('gap-ascp-edu');
  });
});
