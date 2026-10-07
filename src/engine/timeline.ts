import type { Cue, Ease, Keyframe, Lesson, Scene, VisualObject } from '../schema/types';

export type PropValue = number | string | boolean | string[] | (string | number)[][];
export type Props = Record<string, PropValue>;

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

export function ease(kind: Ease | undefined, x: number): number {
  const t = clamp01(x);
  switch (kind) {
    case 'linear':
      return t;
    case 'in':
      return t * t;
    case 'out':
      return 1 - (1 - t) * (1 - t);
    case 'step':
      return t < 1 ? 0 : 1;
    case 'inOut':
    default:
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }
}

/**
 * Resolves an object's properties at a scene-relative time.
 *
 * Semantics (kept deliberately simple for authors):
 * - Before a property's first keyframe, the base value from `props` is shown
 *   (or the first keyframe's value if `props` doesn't define it).
 * - Between two keyframes that both define the property, numbers are interpolated
 *   using the *destination* keyframe's easing; other values step at the keyframe.
 * - After the last keyframe, its value holds.
 */
export function resolveProps(obj: VisualObject, localT: number): Props {
  const out: Props = { ...(obj.props as Props) };
  const keys = obj.keys ?? [];
  if (keys.length === 0) return out;

  const byProp = new Map<string, Keyframe[]>();
  for (const k of keys)
    for (const name of Object.keys(k)) {
      if (name === 't' || name === 'ease' || k[name] === undefined) continue;
      if (!byProp.has(name)) byProp.set(name, []);
      byProp.get(name)!.push(k);
    }

  for (const [name, ks] of byProp) {
    if (localT < ks[0].t) {
      if (!(name in out)) out[name] = ks[0][name] as PropValue;
      continue;
    }
    let i = 0;
    while (i + 1 < ks.length && ks[i + 1].t <= localT) i++;
    const a = ks[i];
    const b = ks[i + 1];
    const av = a[name];
    const bv = b?.[name];
    if (!b || typeof av !== 'number' || typeof bv !== 'number') {
      out[name] = av as PropValue;
      continue;
    }
    const span = b.t - a.t;
    const p = span <= 0 ? 1 : ease(b.ease, (localT - a.t) / span);
    out[name] = av + (bv - av) * p;
  }
  return out;
}

export function sceneAt(lesson: Pick<Lesson, 'scenes'>, t: number): { scene: Scene; index: number } {
  const scenes = lesson.scenes;
  for (let i = 0; i < scenes.length; i++) {
    if (t < scenes[i].end) return { scene: scenes[i], index: i };
  }
  return { scene: scenes[scenes.length - 1], index: scenes.length - 1 };
}

/** The cue showing at time t, or null in gaps between cues. */
export function cueAt(lesson: Pick<Lesson, 'scenes'>, t: number): Cue | null {
  const { scene } = sceneAt(lesson, t);
  for (const c of scene.cues) if (t >= c.start && t < c.end) return c;
  return null;
}

export function allCues(lesson: Pick<Lesson, 'scenes'>): (Cue & { sceneId: string; sceneTitle: string })[] {
  return lesson.scenes.flatMap((s) => s.cues.map((c) => ({ ...c, sceneId: s.id, sceneTitle: s.title })));
}

/**
 * Reduced-motion rendering time: instead of tweening, show the settled end state of
 * the current caption (or of the scene if between captions). Visual state changes
 * in discrete steps synchronized to the narration/captions.
 */
export function reducedMotionTime(lesson: Pick<Lesson, 'scenes'>, t: number): number {
  const { scene } = sceneAt(lesson, t);
  const settle = (end: number) => Math.max(scene.start, Math.min(end, scene.end) - 0.001);
  for (const c of scene.cues) {
    if (t < c.end) return settle(c.end);
  }
  return settle(scene.end);
}

export function formatTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
