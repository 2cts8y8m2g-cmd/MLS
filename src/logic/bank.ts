import type { BankQuestion, QuestionBank } from '../schema/types';
import type { Attempt } from '../state/model';
import { latestByQuestion } from './quiz';

export const bankLessonId = (bank: Pick<QuestionBank, 'id'>) => `bank:${bank.id}`;
export const isBankAttempt = (a: Pick<Attempt, 'lessonId'>) => a.lessonId.startsWith('bank:');

export interface BankFilter {
  domain?: string;
  chapter?: number;
  /** 'all' = any question; 'new' = never answered; 'missed' = last answer was wrong. */
  pool?: 'all' | 'new' | 'missed';
}

/** Questions matching a filter, in book order. */
export function filterBank(bank: QuestionBank, f: BankFilter, attempts: Attempt[]): BankQuestion[] {
  const latest = latestByQuestion(attempts.filter(isBankAttempt));
  return bank.questions.filter((q) => {
    if (f.domain && q.domain !== f.domain) return false;
    if (f.chapter && q.chapter !== f.chapter) return false;
    const last = latest.get(q.id);
    if (f.pool === 'new') return !last;
    if (f.pool === 'missed') return !!last && !last.correct;
    return true;
  });
}

/** Deterministic shuffle (mulberry32) so a session can be rebuilt from its seed. */
export function shuffle<T>(items: T[], seed: number): T[] {
  let a = seed >>> 0;
  const rnd = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function buildSession(bank: QuestionBank, f: BankFilter, attempts: Attempt[], size: number, seed: number): BankQuestion[] {
  return shuffle(filterBank(bank, f, attempts), seed).slice(0, Math.max(1, size));
}

export function bankAttempt(bank: QuestionBank, q: BankQuestion, choice: string, skill: string, at = new Date().toISOString()): Attempt {
  return { qid: q.id, lessonId: bankLessonId(bank), skill, domain: q.domain, topic: q.topic, choice, correct: choice === q.answer, at };
}

/** Per-chapter answered/correct counts from the latest attempt per question. */
export function chapterStats(bank: QuestionBank, attempts: Attempt[]) {
  const latest = latestByQuestion(attempts.filter(isBankAttempt));
  const m = new Map<number, { total: number; answered: number; correct: number }>();
  for (const q of bank.questions) {
    const s = m.get(q.chapter) ?? { total: 0, answered: 0, correct: 0 };
    s.total++;
    const a = latest.get(q.id);
    if (a) {
      s.answered++;
      if (a.correct) s.correct++;
    }
    m.set(q.chapter, s);
  }
  return m;
}
