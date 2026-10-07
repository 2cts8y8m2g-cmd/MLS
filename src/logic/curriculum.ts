import type { Concept, Curriculum, Domain, Lesson, Topic, TrackId } from '../schema/types';
import type { ValidationResult } from '../schema/validate';
import type { TrackChoice } from '../state/model';

export interface LessonEntry {
  lesson: Lesson;
  validation: ValidationResult;
  reviewNeeds: string[];
}

export interface FlatConcept {
  concept: Concept;
  topic: Topic;
  domain: Domain;
  order: number;
}

export const inTrack = (tracks: TrackId[], choice: TrackChoice) => choice === 'both' || tracks.includes(choice);

/** Concepts in recommended learning order: domain sequence, then authoring order. */
export function flattenCurriculum(c: Curriculum): FlatConcept[] {
  const out: FlatConcept[] = [];
  const domains = [...c.domains].sort((a, b) => a.sequence - b.sequence);
  let order = 0;
  for (const domain of domains) for (const topic of domain.topics) for (const concept of topic.concepts) out.push({ concept, topic, domain, order: order++ });
  return out;
}

/** Map concept id → the completed lesson that teaches it (incomplete lessons are ignored). */
export function lessonForConcept(entries: LessonEntry[]): Map<string, LessonEntry> {
  const m = new Map<string, LessonEntry>();
  for (const e of entries) if (e.validation.complete) for (const c of e.lesson.conceptIds) if (!m.has(c)) m.set(c, e);
  return m;
}

export type ConceptStatus = 'complete' | 'complete-needs-review' | 'draft' | 'pending';

export function conceptStatus(conceptId: string, entries: LessonEntry[]): ConceptStatus {
  const covering = entries.filter((e) => e.lesson.conceptIds.includes(conceptId));
  const done = covering.find((e) => e.validation.complete);
  if (done) return done.reviewNeeds.length ? 'complete-needs-review' : 'complete';
  if (covering.length) return 'draft';
  return 'pending';
}

export interface DomainCoverage {
  domain: Domain;
  total: number;
  complete: number;
  needsReview: number;
  draft: number;
  pending: number;
  mappedToReviewer: number;
}

export function coverage(c: Curriculum, entries: LessonEntry[], track: TrackChoice = 'both'): DomainCoverage[] {
  return [...c.domains]
    .sort((a, b) => a.sequence - b.sequence)
    .filter((d) => inTrack(d.tracks, track))
    .map((domain) => {
      const concepts = domain.topics.flatMap((t) => t.concepts).filter((k) => inTrack(k.tracks, track));
      const stat: DomainCoverage = { domain, total: concepts.length, complete: 0, needsReview: 0, draft: 0, pending: 0, mappedToReviewer: 0 };
      for (const k of concepts) {
        const s = conceptStatus(k.id, entries);
        if (s === 'complete') stat.complete++;
        else if (s === 'complete-needs-review') {
          stat.complete++;
          stat.needsReview++;
        } else if (s === 'draft') stat.draft++;
        else stat.pending++;
        if (k.reviewerRef) stat.mappedToReviewer++;
      }
      return stat;
    });
}
