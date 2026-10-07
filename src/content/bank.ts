import type { QuestionBank } from '../schema/types';

let cache: Promise<QuestionBank> | null = null;

/**
 * Loads the imported reviewer Exam Simulator on demand, so its ~700 KB of text
 * is not part of the main bundle.
 */
export function loadReviewerBank(): Promise<QuestionBank> {
  cache ??= import('../../content/question-bank/reviewer-simulator.json').then((m) => m.default as unknown as QuestionBank);
  return cache;
}
