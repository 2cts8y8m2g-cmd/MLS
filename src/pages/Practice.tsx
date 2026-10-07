import { useEffect, useMemo, useState } from 'react';
import { curriculum, domainTitle, lessonEntries, reviewer, reviewerReview, topicTitle } from '../content';
import { loadReviewerBank } from '../content/bank';
import { bankAttempt, buildSession, chapterStats, filterBank, type BankFilter } from '../logic/bank';
import type { BankQuestion, QuestionBank } from '../schema/types';
import { href, useRoute } from '../router';
import { addAttempts } from '../state/model';
import { update, useAppState } from '../state/store';
import { Meter, Panel } from '../components/bits';

type Mode = 'practice' | 'exam';
interface Session {
  mode: Mode;
  questions: BankQuestion[];
  index: number;
  answers: Record<string, string>;
  checked: Record<string, boolean>;
  startedAt: number;
}

const SECONDS_PER_Q = 90;
const chapterTitle = (n: number) => reviewer.chapters.find((c) => c.n === n)?.title ?? `Chapter ${n}`;
const skillOf = (q: BankQuestion) => `Ch. ${q.chapter} · ${topicTitle(q.topic)}`;

export function PracticePage() {
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    loadReviewerBank().then(setBank, () => setError(true));
  }, []);
  return (
    <div className="page">
      <h1>Practice questions</h1>
      <p className="lead">Exam-style multiple-choice practice from the reviewer’s own Exam Simulator. Your answers count toward weak-area review.</p>
      {error ? <p role="alert">The question bank could not be loaded.</p> : !bank ? <p className="muted">Loading questions…</p> : <BankPractice bank={bank} />}
    </div>
  );
}

function Provenance({ bank }: { bank: QuestionBank }) {
  return (
    <div className="notice" data-testid="bank-provenance">
      <p><strong>{bank.title}</strong> — {bank.count} questions. {bank.permission}</p>
      <p className="small">{bank.verification} See the <a href={href('/coverage')}>reviewer accuracy register</a>.</p>
    </div>
  );
}

function BankPractice({ bank }: { bank: QuestionBank }) {
  const state = useAppState();
  const { query } = useRoute();
  const [filter, setFilter] = useState<BankFilter>(() => {
    const pool = query.get('pool');
    const chapter = Number(query.get('chapter')) || undefined;
    return { pool: pool === 'missed' || pool === 'new' ? pool : 'all', chapter, domain: bank.questions.find((q) => q.chapter === chapter)?.domain };
  });
  const [size, setSize] = useState(20);
  const [mode, setMode] = useState<Mode>('practice');
  const [session, setSession] = useState<Session | null>(null);

  const domains = useMemo(() => curriculum.domains.filter((d) => bank.questions.some((q) => q.domain === d.id)), [bank]);
  const chapters = useMemo(() => [...new Set(bank.questions.filter((q) => !filter.domain || q.domain === filter.domain).map((q) => q.chapter))].sort((a, b) => a - b), [bank, filter.domain]);
  const available = filterBank(bank, filter, state.attempts).length;
  const stats = chapterStats(bank, state.attempts);

  if (session) return <Runner bank={bank} session={session} setSession={setSession} />;

  const start = () => {
    const questions = buildSession(bank, filter, state.attempts, size, Date.now() & 0xffffffff);
    if (questions.length) setSession({ mode, questions, index: 0, answers: {}, checked: {}, startedAt: Date.now() });
  };

  const domainRows = domains.map((d) => {
    let total = 0, answered = 0, correct = 0;
    for (const [ch, s] of stats) if (bank.questions.find((q) => q.chapter === ch)?.domain === d.id) { total += s.total; answered += s.answered; correct += s.correct; }
    return { d, total, answered, correct };
  });

  return (
    <>
      <Provenance bank={bank} />
      <Panel title="Start a set" id="setup">
        <div className="form-grid">
          <label className="field">Area
            <select value={filter.domain ?? ''} onChange={(e) => setFilter({ ...filter, domain: e.target.value || undefined, chapter: undefined })} data-testid="bank-domain">
              <option value="">All areas</option>
              {domains.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
            </select>
          </label>
          <label className="field">Chapter
            <select value={filter.chapter ?? ''} onChange={(e) => setFilter({ ...filter, chapter: e.target.value ? Number(e.target.value) : undefined })}>
              <option value="">All chapters</option>
              {chapters.map((c) => <option key={c} value={c}>Ch. {c} · {chapterTitle(c)}</option>)}
            </select>
          </label>
          <label className="field">Questions
            <select value={filter.pool} onChange={(e) => setFilter({ ...filter, pool: e.target.value as BankFilter['pool'] })}>
              <option value="all">All</option>
              <option value="new">Not yet answered</option>
              <option value="missed">Missed last time</option>
            </select>
          </label>
          <label className="field">Set size
            <select value={size} onChange={(e) => setSize(Number(e.target.value))}>
              {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <fieldset className="field">
            <legend>Mode</legend>
            <label><input type="radio" name="mode" checked={mode === 'practice'} onChange={() => setMode('practice')} /> Practice — feedback after each question</label>
            <label><input type="radio" name="mode" checked={mode === 'exam'} onChange={() => setMode('exam')} /> Timed exam — {SECONDS_PER_Q} s per question, feedback at the end</label>
          </fieldset>
        </div>
        <p className="small muted" data-testid="bank-available">{available} question{available === 1 ? '' : 's'} match.</p>
        <button className="btn" onClick={start} disabled={!available} data-testid="bank-start">Start {Math.min(size, available)} questions</button>
      </Panel>
      <Panel title="Your progress by area" id="bank-progress">
        <table className="table">
          <thead><tr><th scope="col">Area</th><th scope="col">Answered</th><th scope="col">Correct (latest)</th></tr></thead>
          <tbody>
            {domainRows.map(({ d, total, answered, correct }) => (
              <tr key={d.id}>
                <td>{d.title}</td>
                <td>{answered} / {total}</td>
                <td>{answered ? <><Meter value={correct / answered} label={`${d.title} accuracy`} /> {Math.round((correct / answered) * 100)}%</> : <span className="muted">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  );
}

function Runner({ bank, session, setSession }: { bank: QuestionBank; session: Session; setSession: (s: Session | null) => void }) {
  const { mode, questions, index, answers, checked } = session;
  const done = index >= questions.length;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (mode !== 'exam' || done) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [mode, done]);

  if (done) return <Results bank={bank} session={session} setSession={setSession} />;

  const q = questions[index];
  const chosen = answers[q.id];
  const isChecked = !!checked[q.id];
  const record = () => update((s) => addAttempts(s, [bankAttempt(bank, q, chosen, skillOf(q))]));
  const check = () => {
    if (!chosen || isChecked) return;
    record();
    setSession({ ...session, checked: { ...checked, [q.id]: true } });
  };
  const next = () => {
    if (mode === 'exam' && chosen && !isChecked) {
      record();
      setSession({ ...session, checked: { ...checked, [q.id]: true }, index: index + 1 });
      return;
    }
    setSession({ ...session, index: index + 1 });
  };
  const elapsed = Math.floor((now - session.startedAt) / 1000);
  const budget = questions.length * SECONDS_PER_Q;

  return (
    <section className="quiz" aria-labelledby="bank-q-h">
      <div className="quiz-head">
        <h2 id="bank-q-h">Question {index + 1} of {questions.length}</h2>
        <p className="quiz-score small">
          {mode === 'exam' ? <span data-testid="bank-timer">⏱ {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')} of {Math.floor(budget / 60)} min pace</span> : 'Practice mode'}
          {' '}· <button className="link-btn" onClick={() => setSession({ ...session, index: questions.length })}>End set</button>
        </p>
      </div>
      <BankQuestionView bank={bank} q={q} chosen={chosen} revealed={mode === 'practice' && isChecked}
        onChoose={(id) => !isChecked && setSession({ ...session, answers: { ...answers, [q.id]: id } })} />
      <div className="question-foot">
        {mode === 'practice' && !isChecked ? (
          <button className="btn" onClick={check} disabled={!chosen} data-testid="bank-check">Check answer</button>
        ) : (
          <button className="btn" onClick={next} data-testid="bank-next">{index + 1 === questions.length ? 'See results' : 'Next question'}</button>
        )}
        {mode === 'exam' && !chosen && <span className="small muted">Unanswered questions count as wrong.</span>}
      </div>
    </section>
  );
}

function BankQuestionView({ bank, q, chosen, revealed, onChoose }: { bank: QuestionBank; q: BankQuestion; chosen?: string; revealed: boolean; onChoose?: (id: string) => void }) {
  const correct = chosen === q.answer;
  const lessons = lessonEntries.filter((e) => e.validation.complete && e.lesson.topic === q.topic);
  const openFlags = reviewerReview.flags.filter((f) => f.location.chapter === q.chapter && f.status !== 'resolved').length;
  return (
    <fieldset className={`question ${revealed ? (correct ? 'is-correct' : 'is-wrong') : ''}`} data-testid={`bank-question-${q.id}`}>
      <legend>
        <span className="q-num">Ch. {q.chapter}</span> {q.stem}
      </legend>
      <div className="options" role="radiogroup">
        {q.options.map((o) => {
          const st = !revealed ? '' : o.id === q.answer ? 'opt-correct' : o.id === chosen ? 'opt-wrong' : 'opt-other';
          return (
            <label key={o.id} className={`option ${st} ${chosen === o.id ? 'chosen' : ''}`}>
              <input type="radio" name={q.id} value={o.id} checked={chosen === o.id} disabled={revealed || !onChoose} onChange={() => onChoose?.(o.id)} />
              <span className="option-body"><span className="option-text"><b>{o.id.toUpperCase()}.</b> {o.text}</span></span>
            </label>
          );
        })}
      </div>
      {revealed && (
        <div className="bank-feedback" role="status">
          <p className={`verdict ${correct ? 'good' : 'bad'}`}>{correct ? 'Correct.' : chosen ? `Not quite — the reviewer’s answer is ${q.answer.toUpperCase()}.` : `Unanswered — the reviewer’s answer is ${q.answer.toUpperCase()}.`}</p>
          <p><span className="rationale-tag">Reviewer’s explanation</span> {q.explanation}</p>
          {q.notes.map((n) => (
            <p key={n.flagId} className="flag-note" data-testid="bank-note"><strong>⚠ Accuracy note:</strong> {n.note} <a href={href('/coverage')}>Register: {n.flagId}</a></p>
          ))}
          <p className="small muted">
            Source: {bank.title}, Q{q.number} · Ch. {q.chapter} {chapterTitle(q.chapter)} · not verified by this app
            {openFlags > 0 && <> · {openFlags} open accuracy flag{openFlags === 1 ? '' : 's'} in this chapter</>}
          </p>
          {lessons.length > 0 && (
            <p className="small">Learn it: {lessons.map((e, i) => <span key={e.lesson.id}>{i ? ' · ' : ''}<a href={href(`/lesson/${e.lesson.id}`)}>{e.lesson.title}</a></span>)}</p>
          )}
        </div>
      )}
    </fieldset>
  );
}

function Results({ bank, session, setSession }: { bank: QuestionBank; session: Session; setSession: (s: Session | null) => void }) {
  const qs = session.questions.filter((q) => session.mode === 'practice' ? session.checked[q.id] : true);
  const correct = qs.filter((q) => session.answers[q.id] === q.answer).length;
  const pct = qs.length ? Math.round((correct / qs.length) * 100) : 0;
  const byDomain = new Map<string, { n: number; c: number }>();
  for (const q of qs) {
    const s = byDomain.get(q.domain) ?? { n: 0, c: 0 };
    s.n++;
    if (session.answers[q.id] === q.answer) s.c++;
    byDomain.set(q.domain, s);
  }
  return (
    <section aria-labelledby="bank-res-h">
      <h2 id="bank-res-h">Results</h2>
      <p className="lead" data-testid="bank-score"><strong>{correct} of {qs.length}</strong> correct ({pct}%).</p>
      <p className="small muted">This measures how well you know the reviewer’s content, not a prediction of exam-day performance.</p>
      <ul>
        {[...byDomain].map(([d, s]) => <li key={d}>{domainTitle(d)}: {s.c}/{s.n}</li>)}
      </ul>
      <button className="btn" onClick={() => setSession(null)} data-testid="bank-again">New set</button>
      {session.mode === 'exam' && (
        <>
          <h3>Review your answers</h3>
          {session.questions.map((q) => <BankQuestionView key={q.id} bank={bank} q={q} chosen={session.answers[q.id]} revealed />)}
        </>
      )}
    </section>
  );
}
