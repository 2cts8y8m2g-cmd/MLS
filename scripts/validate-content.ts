/**
 * Validates every lesson and the curriculum. Exits non-zero on structural errors.
 * Usage: npm run validate
 */
import { validateCurriculum } from '../src/schema/validate';
import { loadContent } from './load-content';

const { curriculum, lessons } = loadContent();
let failed = false;

const cErr = validateCurriculum(curriculum);
if (cErr.length) {
  failed = true;
  console.error('✗ curriculum.json');
  cErr.forEach((e) => console.error('   - ' + e));
} else console.log('✓ curriculum.json');

const ids = new Set<string>();
for (const { file, lesson, validation, reviewNeeds } of lessons) {
  if (ids.has(lesson.id)) {
    failed = true;
    console.error(`✗ duplicate lesson id ${lesson.id}`);
  }
  ids.add(lesson.id);
  if (validation.errors.length) failed = true;
  const mark = validation.errors.length ? '✗' : validation.complete ? '✓' : '△';
  console.log(`${mark} ${file} — ${validation.complete ? 'COMPLETE' : validation.errors.length ? 'INVALID' : 'INCOMPLETE (draft)'}`);
  validation.errors.forEach((e) => console.log('   error: ' + e));
  validation.checklist.filter((c) => !c.ok).forEach((c) => console.log(`   missing: ${c.label}${c.detail ? ` (${c.detail})` : ''}`));
  reviewNeeds.forEach((n) => console.log('   review: ' + n));
}
console.log(`\n${lessons.length} lesson file(s); ${lessons.filter((l) => l.validation.complete).length} complete.`);
process.exit(failed ? 1 : 0);
