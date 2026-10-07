import curriculumJson from '../../content/curriculum.json';
import reviewerJson from '../../content/reviewer.json';
import tracksJson from '../../content/tracks.json';
import type { Curriculum, Lesson, ReviewerStatus, Track } from '../schema/types';
import { reviewNeeds, validateLesson } from '../schema/validate';
import { flattenCurriculum, type LessonEntry } from '../logic/curriculum';

/**
 * Content registry. Every JSON file in /content/lessons is picked up automatically —
 * adding a lesson never requires editing application code.
 */
const lessonModules = import.meta.glob('../../content/lessons/*.json', { eager: true, import: 'default' });

export const curriculum = curriculumJson as unknown as Curriculum;
export const tracks = tracksJson as unknown as Track[];
export const reviewer = reviewerJson as unknown as ReviewerStatus;

export const conceptIndex = new Map(flattenCurriculum(curriculum).map((f) => [f.concept.id, f]));
const knownIds = new Set(conceptIndex.keys());

export const lessonEntries: LessonEntry[] = Object.values(lessonModules)
  .map((raw) => {
    const validation = validateLesson(raw, knownIds);
    const lesson = raw as Lesson;
    return { lesson, validation, reviewNeeds: validation.errors.length ? ['Fails validation.'] : reviewNeeds(lesson) };
  })
  .sort((a, b) => a.lesson.title.localeCompare(b.lesson.title));

export const lessonById = new Map(lessonEntries.map((e) => [e.lesson.id, e]));

export const domainTitle = (id: string) => curriculum.domains.find((d) => d.id === id)?.title ?? id;
export const topicTitle = (id: string) => {
  for (const d of curriculum.domains) for (const t of d.topics) if (t.id === id) return t.title;
  return id;
};
export const conceptTitle = (id: string) => conceptIndex.get(id)?.concept.title ?? id;

export function questionById(qid: string) {
  for (const e of lessonEntries) {
    const q = e.lesson.questions.find((x) => x.id === qid);
    if (q) return { question: q, entry: e };
  }
  return null;
}

export { knownIds };
