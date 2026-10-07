import type { Lesson, Question } from '../schema/types';
import type { Attempt } from '../state/model';

export interface QuizResult {
  correct: number;
  total: number;
  percent: number;
  items: { qid: string; choice: string | null; correct: boolean }[];
}

/** Scores a set of answers. Unanswered questions count as incorrect. */
export function scoreQuiz(questions: Question[], answers: Record<string, string | undefined>): QuizResult {
  const items = questions.map((q) => {
    const choice = answers[q.id] ?? null;
    return { qid: q.id, choice, correct: choice === q.answer };
  });
  const correct = items.filter((i) => i.correct).length;
  const total = questions.length;
  return { correct, total, percent: total ? Math.round((correct / total) * 100) : 0, items };
}

export function toAttempts(lesson: Lesson, questions: Question[], answers: Record<string, string | undefined>, at = new Date().toISOString()): Attempt[] {
  return questions
    .filter((q) => answers[q.id] !== undefined)
    .map((q) => ({
      qid: q.id,
      lessonId: lesson.id,
      skill: q.skill,
      domain: lesson.domain,
      topic: lesson.topic,
      choice: answers[q.id]!,
      correct: answers[q.id] === q.answer,
      at,
    }));
}

/** Most recent attempt per question. */
export function latestByQuestion(attempts: Attempt[]): Map<string, Attempt> {
  const m = new Map<string, Attempt>();
  for (const a of attempts) {
    const prev = m.get(a.qid);
    if (!prev || prev.at <= a.at) m.set(a.qid, a);
  }
  return m;
}
