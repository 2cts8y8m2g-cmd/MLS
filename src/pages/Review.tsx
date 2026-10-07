import { useMemo, useState } from 'react';
import { domainTitle, lessonEntries, questionById, topicTitle } from '../content';
import { areaStats, weakAreas } from '../logic/weak';
import { isBankAttempt } from '../logic/bank';
import { inTrack } from '../logic/curriculum';
import { href } from '../router';
import { useAppState } from '../state/store';
import { useSettings } from '../state/hooks';
import { Meter, Panel } from '../components/bits';
import { Quiz } from '../components/Quiz';

export function ReviewPage() {
  const state = useAppState();
  const [settings] = useSettings();
  const [mode, setMode] = useState<'none' | 'missed' | 'all'>('none');
  const [session, setSession] = useState(0);
  const attempts = state.attempts.filter((a) => {
    const e = lessonEntries.find((x) => x.lesson.id === a.lessonId);
    return e ? inTrack(e.lesson.tracks, settings.track) : false;
  });
  const weakSkills = weakAreas(attempts, 'skill');
  const topics = areaStats(attempts, 'topic', topicTitle).sort((a, b) => a.accuracy - b.accuracy);
  const domains = areaStats(attempts, 'domain', domainTitle).sort((a, b) => a.accuracy - b.accuracy);

  // Items are frozen when a session starts so answering doesn't reshuffle the list.
  const items = useMemo(() => {
    if (mode === 'missed') {
      const ids = new Set(weakSkills.flatMap((w) => w.missedQuestionIds));
      return [...ids].map((id) => questionById(id)).filter(Boolean).map((x) => ({ lesson: x!.entry.lesson, question: x!.question }));
    }
    if (mode === 'all')
      return lessonEntries
        .filter((e) => e.validation.complete && inTrack(e.lesson.tracks, settings.track))
        .flatMap((e) => e.lesson.questions.map((question) => ({ lesson: e.lesson, question })));
    return [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, session]);

  const missedCount = new Set(weakSkills.flatMap((w) => w.missedQuestionIds)).size;
  const bankTopics = areaStats(state.attempts.filter(isBankAttempt), 'topic', topicTitle).sort((a, b) => a.accuracy - b.accuracy);

  return (
    <div className="page">
      <h1>Weak-area review</h1>
      <p className="lead">Built only from your real answers. Accuracy weighs your most recent attempts most, so improvement shows up quickly.</p>

      {attempts.length === 0 ? (
        <div className="notice">No answers recorded yet for this track. Watch a lesson and answer its questions — your weak areas will appear here.</div>
      ) : (
        <div className="grid-2">
          <Panel title="Skills to strengthen" id="weak-skills">
            {weakSkills.length ? (
              <ul className="weak-list">
                {weakSkills.map((w) => (
                  <li key={w.key}>
                    <span>{w.label}<span className="small muted"> · {w.correct}/{w.attempts} correct</span></span>
                    <Meter value={w.accuracy} label={w.label} />
                    <span className="small">{Math.round(w.accuracy * 100)}%</span>
                    {w.lessonIds.map((id) => <a key={id} className="small" href={href(`/lesson/${id}`)}>Rewatch</a>)}
                  </li>
                ))}
              </ul>
            ) : <p className="muted">No weak skills — every skill is at or above 70% and your latest answers are correct.</p>}
          </Panel>
          <Panel title="By topic and domain" id="by-topic">
            <ul className="weak-list">
              {[...domains, ...topics].map((w) => (
                <li key={w.kind + w.key}>
                  <span>{w.label} <span className="small muted">({w.kind})</span></span>
                  <Meter value={w.accuracy} label={w.label} />
                  <span className="small">{Math.round(w.accuracy * 100)}%</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      )}

      <Panel title="Reviewer question bank" id="bank-review">
        {bankTopics.length ? (
          <ul className="weak-list" data-testid="bank-weak">
            {bankTopics.slice(0, 12).map((w) => (
              <li key={w.key}>
                <span>{w.label}<span className="small muted"> · {w.correct}/{w.attempts} correct</span></span>
                <Meter value={w.accuracy} label={w.label} />
                <span className="small">{Math.round(w.accuracy * 100)}%</span>
                {w.missedQuestionIds.length > 0 && <a className="small" href={href(`/practice?pool=missed&chapter=${w.key.replace(/^ch/, '')}`)}>Retry {w.missedQuestionIds.length} missed</a>}
              </li>
            ))}
          </ul>
        ) : <p className="muted">No question-bank answers yet. <a href={href('/practice')}>Practice reviewer questions</a>.</p>}
      </Panel>

      <Panel title="Practice" id="practice">
        <div className="btn-row-wrap">
          <button className="btn" disabled={missedCount === 0} onClick={() => { setMode('missed'); setSession((s) => s + 1); }}>Retry missed questions ({missedCount})</button>
          <button className="btn btn-ghost" onClick={() => { setMode('all'); setSession((s) => s + 1); }}>Practice all available questions</button>
        </div>
        {mode !== 'none' && items.length > 0 && <Quiz key={session} items={items} title={mode === 'missed' ? 'Missed questions' : 'All questions'} />}
        {mode !== 'none' && items.length === 0 && <p className="muted">Nothing to practice here yet.</p>}
      </Panel>
    </div>
  );
}
