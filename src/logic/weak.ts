import type { Attempt } from '../state/model';

export interface AreaStat {
  key: string;
  kind: 'skill' | 'topic' | 'domain';
  label: string;
  attempts: number;
  correct: number;
  /** Recency-weighted accuracy 0–1. */
  accuracy: number;
  lessonIds: string[];
  missedQuestionIds: string[];
}

/**
 * Builds performance statistics from real quiz attempts only.
 * Accuracy is recency-weighted: for each question only the last 3 attempts count,
 * with the newest weighted most, so improvement is reflected quickly.
 */
export function areaStats(attempts: Attempt[], kind: AreaStat['kind'], labelOf: (key: string) => string = (k) => k): AreaStat[] {
  const byQ = new Map<string, Attempt[]>();
  for (const a of [...attempts].sort((x, y) => x.at.localeCompare(y.at))) {
    if (!byQ.has(a.qid)) byQ.set(a.qid, []);
    byQ.get(a.qid)!.push(a);
  }
  const groups = new Map<string, { w: number; c: number; n: number; k: number; lessons: Set<string>; missed: Set<string> }>();
  for (const [qid, list] of byQ) {
    const recent = list.slice(-3);
    const key = recent[recent.length - 1][kind];
    if (!groups.has(key)) groups.set(key, { w: 0, c: 0, n: 0, k: 0, lessons: new Set(), missed: new Set() });
    const g = groups.get(key)!;
    recent.forEach((a, i) => {
      const weight = i + 1; // older → 1, newest → up to 3
      g.w += weight;
      if (a.correct) g.c += weight;
      g.n++;
      if (a.correct) g.k++;
      g.lessons.add(a.lessonId);
    });
    if (!recent[recent.length - 1].correct) g.missed.add(qid);
  }
  return [...groups.entries()].map(([key, g]) => ({
    key,
    kind,
    label: labelOf(key),
    attempts: g.n,
    correct: g.k,
    accuracy: g.w ? g.c / g.w : 0,
    lessonIds: [...g.lessons],
    missedQuestionIds: [...g.missed],
  }));
}

/** Areas below the mastery threshold, weakest first. Only areas with real attempts appear. */
export function weakAreas(attempts: Attempt[], kind: AreaStat['kind'] = 'skill', threshold = 0.7, labelOf?: (k: string) => string): AreaStat[] {
  return areaStats(attempts, kind, labelOf)
    .filter((s) => s.accuracy < threshold || s.missedQuestionIds.length > 0)
    .sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts);
}
