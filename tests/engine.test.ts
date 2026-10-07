import { describe, expect, it } from 'vitest';
import { allCues, cueAt, ease, reducedMotionTime, resolveProps, sceneAt } from '../src/engine/timeline';
import type { VisualObject } from '../src/schema/types';
import { loadContent } from '../scripts/load-content';

const obj = (keys: VisualObject['keys'], props: VisualObject['props'] = {}): VisualObject => ({ id: 'o', type: 'label', props, keys });

describe('resolveProps', () => {
  it('holds the base value before the first keyframe', () => {
    expect(resolveProps(obj([{ t: 2, opacity: 1 }], { opacity: 0 }), 1).opacity).toBe(0);
  });
  it('uses the first keyframe value when the base does not define the prop', () => {
    expect(resolveProps(obj([{ t: 2, x: 50 }, { t: 4, x: 100 }]), 0).x).toBe(50);
  });
  it('interpolates numbers linearly between keys', () => {
    const o = obj([{ t: 0, x: 0 }, { t: 10, x: 100, ease: 'linear' }]);
    expect(resolveProps(o, 2.5).x).toBeCloseTo(25);
    expect(resolveProps(o, 10).x).toBe(100);
    expect(resolveProps(o, 99).x).toBe(100);
  });
  it('applies the destination easing', () => {
    const o = obj([{ t: 0, x: 0 }, { t: 1, x: 1, ease: 'in' }]);
    expect(resolveProps(o, 0.5).x).toBeCloseTo(0.25);
  });
  it('interpolates each property independently', () => {
    const o = obj([{ t: 0, x: 0, opacity: 0 }, { t: 2, opacity: 1, ease: 'linear' }, { t: 4, x: 40, ease: 'linear' }]);
    const p = resolveProps(o, 1);
    expect(p.opacity).toBeCloseTo(0.5);
    expect(p.x).toBeCloseTo(10);
  });
  it('steps non-numeric values at keyframes', () => {
    const o = obj([{ t: 0, result: '' }, { t: 5, result: '4+' }], { result: '' });
    expect(resolveProps(o, 4.9).result).toBe('');
    expect(resolveProps(o, 5).result).toBe('4+');
  });
  it('step easing jumps at the end of the segment', () => {
    const o = obj([{ t: 0, drop: 1 }, { t: 1, drop: 0, ease: 'step' }]);
    expect(resolveProps(o, 0.99).drop).toBe(1);
    expect(resolveProps(o, 1).drop).toBe(0);
  });
  it('ease functions stay within [0,1] at the ends', () => {
    for (const k of ['linear', 'in', 'out', 'inOut', 'step'] as const) {
      expect(ease(k, 0)).toBe(0);
      expect(ease(k, 1)).toBe(1);
    }
  });
});

const { lessons } = loadContent();

describe.each(lessons.map((l) => [l.lesson.id, l.lesson] as const))('timeline: %s', (_id, lesson) => {
  it('finds the scene and cue for every caption time', () => {
    for (const c of allCues(lesson)) {
      const mid = (c.start + c.end) / 2;
      expect(cueAt(lesson, mid)?.id).toBe(c.id);
      const { scene } = sceneAt(lesson, mid);
      expect(scene.cues.some((x) => x.id === c.id)).toBe(true);
    }
  });
  it('maps scene boundaries to the next scene', () => {
    lesson.scenes.slice(1).forEach((s, i) => {
      expect(sceneAt(lesson, s.start).index).toBe(i + 1);
    });
    expect(sceneAt(lesson, lesson.duration).index).toBe(lesson.scenes.length - 1);
  });
  it('reduced-motion time snaps to the settled end of the current caption', () => {
    const c = allCues(lesson)[3];
    const rt = reducedMotionTime(lesson, c.start + 0.1);
    expect(rt).toBeLessThan(c.end);
    expect(rt).toBeGreaterThan(c.end - 0.01);
    expect(reducedMotionTime(lesson, c.end - 0.2)).toBe(rt);
  });
  it('every keyframe fits inside its scene and every scene animates something', () => {
    for (const s of lesson.scenes) {
      const len = s.end - s.start;
      expect(s.objects.some((o) => (o.keys?.length ?? 0) >= 2)).toBe(true);
      for (const o of s.objects) for (const k of o.keys ?? []) expect(k.t).toBeLessThanOrEqual(len);
    }
  });
  it('visual changes are synchronized with captions: something moves during every cue', () => {
    for (const s of lesson.scenes)
      for (const c of s.cues) {
        const a = c.start - s.start;
        const b = c.end - s.start;
        const moving = s.objects.some((o) => (o.keys ?? []).some((k) => k.t > a - 0.01 && k.t <= b + 0.01));
        expect(moving, `${s.id}/${c.id}`).toBe(true);
      }
  });
  it('every visual object type is known to the renderer', async () => {
    const { VISUAL_TYPES } = await import('../src/schema/types');
    for (const s of lesson.scenes) for (const o of s.objects) expect(VISUAL_TYPES).toContain(o.type);
  });
});
