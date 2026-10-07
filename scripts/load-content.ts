import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Curriculum, Lesson, ReviewerStatus, Track } from '../src/schema/types';
import { reviewNeeds, validateLesson } from '../src/schema/validate';
import { flattenCurriculum, type LessonEntry } from '../src/logic/curriculum';

export const ROOT = resolve(import.meta.dirname, '..');
const read = (p: string) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));

export function loadContent() {
  const curriculum = read('content/curriculum.json') as Curriculum;
  const tracks = read('content/tracks.json') as Track[];
  const reviewer = read('content/reviewer.json') as ReviewerStatus;
  const known = new Set(flattenCurriculum(curriculum).map((f) => f.concept.id));
  const files = readdirSync(join(ROOT, 'content/lessons')).filter((f) => f.endsWith('.json')).sort();
  const lessons: (LessonEntry & { file: string })[] = files.map((file) => {
    const raw = read(`content/lessons/${file}`);
    const validation = validateLesson(raw, known);
    return { file, lesson: raw as Lesson, validation, reviewNeeds: validation.errors.length ? ['Fails validation.'] : reviewNeeds(raw as Lesson) };
  });
  return { curriculum, tracks, reviewer, lessons, known };
}
