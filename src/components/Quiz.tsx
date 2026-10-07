import { useMemo, useState } from 'react';
import type { Lesson, Question } from '../schema/types';
import { scoreQuiz, toAttempts } from '../logic/quiz';
import { addAttempts } from '../state/model';
import { update } from '../state/store';

interface Props {
  items: { lesson: Lesson; question: Question }[];
  title?: string;
  /** When false (authoring preview), answers are scored but not saved. */
  record?: boolean;
  /** Called after each question is checked. */
  onChecked?: () => void;
}

/**
 * Multiple-choice check with immediate feedback. Every option shows its own
 * rationale after checking, so learners see why distractors are wrong.
 * Each check is recorded as a real attempt for weak-area analysis.
 */
export function Quiz({ items, title = 'Understanding check', onChecked, record = true }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [round, setRound] = useState(0);

  const questions = useMemo(() => items.map((i) => i.question), [items]);
  const checkedQs = questions.filter((q) => checked[q.id]);
  const result = scoreQuiz(checkedQs, answers);
  const allDone = checkedQs.length === questions.length && questions.length > 0;

  const check = (lesson: Lesson, q: Question) => {
    if (!answers[q.id] || checked[q.id]) return;
    setChecked((c) => ({ ...c, [q.id]: true }));
    if (record) update((s) => addAttempts(s, toAttempts(lesson, [q], answers)));
    onChecked?.();
  };
  const reset = () => {
    setAnswers({});
    setChecked({});
    setRound((r) => r + 1);
  };

  return (
    <section className="quiz" aria-labelledby={`quiz-title-${round}`}>
      <div className="quiz-head">
        <h2 id={`quiz-title-${round}`}>{title}</h2>
        <p className="quiz-score" aria-live="polite" data-testid="quiz-score">
          {checkedQs.length === 0 ? `${questions.length} questions` : `Score: ${result.correct} / ${checkedQs.length} checked${allDone ? ` · ${result.percent}%` : ''}`}
        </p>
      </div>
      {items.map(({ lesson, question: q }, qi) => {
        const isChecked = !!checked[q.id];
        const chosen = answers[q.id];
        const correct = chosen === q.answer;
        return (
          <fieldset key={`${round}-${q.id}`} className={`question ${isChecked ? (correct ? 'is-correct' : 'is-wrong') : ''}`} data-testid={`question-${q.id}`}>
            <legend>
              <span className="q-num">Q{qi + 1}</span> {q.stem}
            </legend>
            <div className="options" role="radiogroup">
              {q.options.map((o) => {
                const state = !isChecked ? '' : o.id === q.answer ? 'opt-correct' : o.id === chosen ? 'opt-wrong' : 'opt-other';
                return (
                  <label key={o.id} className={`option ${state} ${chosen === o.id ? 'chosen' : ''}`}>
                    <input
                      type="radio"
                      name={`${round}-${q.id}`}
                      value={o.id}
                      checked={chosen === o.id}
                      disabled={isChecked}
                      onChange={() => setAnswers((a) => ({ ...a, [q.id]: o.id }))}
                    />
                    <span className="option-body">
                      <span className="option-text"><b>{o.id.toUpperCase()}.</b> {o.text}</span>
                      {isChecked && (
                        <span className="rationale">
                          <span className="rationale-tag">{o.id === q.answer ? '✓ Correct' : o.id === chosen ? '✗ Your answer' : 'Why not'}</span> {o.rationale}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
            <div className="question-foot">
              {!isChecked ? (
                <button className="btn" onClick={() => check(lesson, q)} disabled={!chosen}>Check answer</button>
              ) : (
                <p className={`verdict ${correct ? 'good' : 'bad'}`} role="status">{correct ? 'Correct.' : `Not quite — the answer is ${q.answer.toUpperCase()}.`}</p>
              )}
              <span className="muted small">Skill: {q.skill}</span>
            </div>
          </fieldset>
        );
      })}
      {allDone && (
        <div className="quiz-done">
          <p><strong>{result.correct} of {result.total}</strong> correct ({result.percent}%). {record ? 'Results are saved to your weak-area review.' : 'Preview mode — results are not saved.'}</p>
          <button className="btn btn-ghost" onClick={reset}>Try again</button>
        </div>
      )}
    </section>
  );
}
