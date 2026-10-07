import { describe, expect, it } from 'vitest';
import { sentenceCount, validateCurriculum, validateLesson } from '../src/schema/validate';
import { lessonTemplate } from '../src/schema/template';
import { loadContent } from '../scripts/load-content';
import type { Lesson } from '../src/schema/types';

const { lessons, known, curriculum } = loadContent();
const ref = lessons.find((l) => l.lesson.id === 'ih-abo-forward-reverse')!.lesson;
const clone = (): Lesson => JSON.parse(JSON.stringify(ref));

describe('validateLesson', () => {
  it('accepts the reference lesson as complete', () => {
    const r = validateLesson(ref, known);
    expect(r.errors).toEqual([]);
    expect(r.checklist.filter((c) => !c.ok)).toEqual([]);
    expect(r.complete).toBe(true);
  });

  it('never counts the template (placeholders) as complete, though it is playable', () => {
    const r = validateLesson(lessonTemplate(), undefined);
    expect(r.errors).toEqual([]);
    expect(r.complete).toBe(false);
    expect(r.checklist.find((c) => c.id === 'no-placeholders')?.ok).toBe(false);
  });

  it('rejects non-objects without throwing', () => {
    expect(validateLesson(null).complete).toBe(false);
    expect(validateLesson('x').errors.length).toBeGreaterThan(0);
  });

  it('requires all eight beats in order', () => {
    const l = clone();
    [l.scenes[1], l.scenes[2]] = [l.scenes[2], l.scenes[1]];
    expect(validateLesson(l, known).checklist.find((c) => c.id === 'scene-order')?.ok).toBe(false);
  });

  it('fails a scene that has visuals but no animation', () => {
    const l = clone();
    l.scenes[0].objects.forEach((o) => delete o.keys);
    const r = validateLesson(l, known);
    expect(r.complete).toBe(false);
    expect(r.checklist.find((c) => c.id === 'scene-0-content')?.detail).toMatch(/animated/);
  });

  it('detects gaps between scenes and cues outside scenes', () => {
    const l = clone();
    l.scenes[1].start += 1;
    l.scenes[2].cues[0].start = l.scenes[2].start - 5;
    const errs = validateLesson(l, known).errors.join('\n');
    expect(errs).toMatch(/contiguous/);
    expect(errs).toMatch(/within the scene/);
  });

  it('requires a rationale on every option and an answer among the options', () => {
    const l = clone();
    l.questions[0].options[2].rationale = '';
    l.questions[1].answer = 'z';
    const r = validateLesson(l, known);
    expect(r.errors.join()).toMatch(/answer "z"/);
    expect(r.checklist.find((c) => c.id === 'questions')?.ok).toBe(false);
  });

  it('requires at least three questions', () => {
    const l = clone();
    l.questions = l.questions.slice(0, 2);
    expect(validateLesson(l, known).complete).toBe(false);
  });

  it('refuses "checked" claims citing a reference that was not consulted', () => {
    const l = clone();
    l.claims[0].refs = ['aabb-tm'];
    expect(validateLesson(l, known).errors.join()).toMatch(/not consulted/);
  });

  it('refuses "checked" claims supported only by the reviewer', () => {
    const l = clone();
    l.claims[0].refs = ['reviewer-ch40'];
    expect(validateLesson(l, known).errors.join()).toMatch(/reviewer alone cannot verify itself/);
  });

  it('requires a reviewer mapping for completeness', () => {
    const l = clone();
    l.reviewer.locations = [];
    expect(validateLesson(l, known).checklist.find((c) => c.id === 'reviewer-map')?.ok).toBe(false);
  });

  it('refuses a claimed expert review without a named reviewer', () => {
    const l = clone();
    l.verification.humanExpertReview = true;
    expect(validateLesson(l, known).errors.join()).toMatch(/no reviewer is named/);
  });

  it('requires a one-sentence takeaway', () => {
    const l = clone();
    l.takeaway = 'One. Two.';
    expect(validateLesson(l, known).checklist.find((c) => c.id === 'takeaway')?.ok).toBe(false);
  });

  it('flags unknown concept ids', () => {
    const l = clone();
    l.conceptIds = ['nope.nope'];
    expect(validateLesson(l, known).errors.join()).toMatch(/not in the curriculum/);
  });
});

describe('sentenceCount', () => {
  it('ignores decimals and abbreviations', () => {
    expect(sentenceCount('Use 0.5 mL, e.g. saline, vs plasma.')).toBe(1);
    expect(sentenceCount('A. B.')).toBe(2);
  });
});

describe('validateCurriculum', () => {
  it('has unique ids, known prerequisites and no cycles', () => {
    expect(validateCurriculum(curriculum)).toEqual([]);
  });
  it('detects cycles', () => {
    const c = JSON.parse(JSON.stringify(curriculum));
    const k = c.domains[0].topics[0].concepts;
    k[0].prerequisites = [k[1].id];
    k[1].prerequisites = [k[0].id];
    expect(validateCurriculum(c).join()).toMatch(/cycle/);
  });
});
