import type { Curriculum } from '../schema/types';
import type { AppState } from '../state/model';
import { flattenCurriculum, inTrack, lessonForConcept, type LessonEntry } from './curriculum';
import { weakAreas } from './weak';

export interface Recommendation {
  lessonId: string;
  title: string;
  reason: string;
  kind: 'review-weak' | 'resume' | 'next' | 'quiz';
}

/**
 * Recommends lessons that actually exist and are complete:
 * 1) lessons tied to weak areas from real quiz results,
 * 2) a lesson in progress,
 * 3) watched lessons whose quiz was never attempted,
 * 4) the next unwatched lesson in the learning sequence whose prerequisites are met
 *    (or, failing that, the earliest unwatched one).
 */
export function recommend(c: Curriculum, entries: LessonEntry[], state: AppState, limit = 4): Recommendation[] {
  const track = state.settings.track;
  const byId = new Map(entries.filter((e) => e.validation.complete && inTrack(e.lesson.tracks, track)).map((e) => [e.lesson.id, e]));
  const recs: Recommendation[] = [];
  const seen = new Set<string>();
  const push = (r: Recommendation) => {
    if (seen.has(r.lessonId) || !byId.has(r.lessonId)) return;
    seen.add(r.lessonId);
    recs.push(r);
  };

  for (const w of weakAreas(state.attempts, 'skill'))
    for (const id of w.lessonIds)
      push({ lessonId: id, title: byId.get(id)?.lesson.title ?? id, kind: 'review-weak', reason: `Review: ${Math.round(w.accuracy * 100)}% on “${w.label}”` });

  for (const [id, p] of Object.entries(state.lessons))
    if (!p.watched && p.lastT > 5) push({ lessonId: id, title: byId.get(id)?.lesson.title ?? id, kind: 'resume', reason: 'Continue where you left off' });

  const attempted = new Set(state.attempts.map((a) => a.lessonId));
  for (const [id, p] of Object.entries(state.lessons))
    if (p.watched && !attempted.has(id)) push({ lessonId: id, title: byId.get(id)?.lesson.title ?? id, kind: 'quiz', reason: 'Watched — now test yourself' });

  const lessonOf = lessonForConcept([...byId.values()]);
  const watchedConcepts = new Set(
    [...byId.values()].filter((e) => state.lessons[e.lesson.id]?.watched).flatMap((e) => e.lesson.conceptIds),
  );
  const ordered = flattenCurriculum(c).filter((f) => inTrack(f.concept.tracks, track));
  const candidates = ordered.filter((f) => lessonOf.has(f.concept.id) && !state.lessons[lessonOf.get(f.concept.id)!.lesson.id]?.watched);
  const ready = candidates.find((f) => f.concept.prerequisites.every((p) => watchedConcepts.has(p) || !lessonOf.has(p)));
  for (const f of ready ? [ready, ...candidates] : candidates) {
    const e = lessonOf.get(f.concept.id)!;
    push({ lessonId: e.lesson.id, title: e.lesson.title, kind: 'next', reason: `Next in sequence: ${f.domain.title} › ${f.topic.title}` });
  }
  return recs.slice(0, limit);
}
