import { useMemo } from 'react';
import type { LessonEntry } from '../logic/curriculum';
import { LessonPlayer } from '../player/LessonPlayer';
import { conceptTitle, lessonById } from '../content';
import { useReducedMotion, useSettings } from '../state/hooks';
import { update, useAppState } from '../state/store';
import { isBookmarked, markWatched, recordPosition, toggleBookmark } from '../state/model';
import { Quiz } from './Quiz';
import { TrackTags } from './bits';
import { lessonForConcept } from '../logic/curriculum';

const CLAIM_LABEL = { checked: 'Checked against a cited source', pending: 'Awaiting verification', analogy: 'Simplified teaching analogy' } as const;

/**
 * Full lesson experience. Used by the lesson page (persist = true) and by the
 * authoring preview (persist = false: nothing is saved to progress).
 */
export function LessonView({ entry, sceneId, persist }: { entry: LessonEntry; sceneId?: string; persist: boolean }) {
  const { lesson } = entry;
  const state = useAppState();
  const [settings, setSettings] = useSettings();
  const reduced = useReducedMotion();
  const saved = state.lessons[lesson.id];
  const startScene = sceneId ? lesson.scenes.find((s) => s.id === sceneId) : undefined;
  // Resume where the learner left off unless they had reached the very end.
  const initialTime = startScene ? startScene.start : persist && saved && saved.lastT < lesson.duration - 1 ? saved.lastT : 0;
  const quizItems = useMemo(() => lesson.questions.map((question) => ({ lesson, question })), [lesson]);
  const lessonOf = useMemo(() => lessonForConcept([...lessonById.values()]), []);
  const bookmarked = isBookmarked(state, lesson.id);
  const ex = lesson.explanation;

  const claimsBy = (s: 'checked' | 'pending' | 'analogy') => lesson.claims.filter((c) => c.status === s);

  return (
    <article className="lesson" aria-labelledby="lesson-title">
      <header className="lesson-head">
        <div>
          <h1 id="lesson-title">{lesson.title}</h1>
          <p className="lead">{lesson.summary}</p>
          <div className="lesson-tags">
            <TrackTags tracks={lesson.tracks} />
            <span className={`pill ${entry.reviewNeeds.length ? 'pill-complete-needs-review' : 'pill-complete'}`}>
              {entry.validation.complete ? (entry.reviewNeeds.length ? 'Complete · requires review' : 'Complete') : 'Draft — incomplete'}
            </span>
            <span className="pill pill-muted">Revised {lesson.revisedAt}</span>
          </div>
        </div>
        {persist && (
          <button className={`btn ${bookmarked ? '' : 'btn-ghost'}`} aria-pressed={bookmarked} onClick={() => update((s) => toggleBookmark(s, { lessonId: lesson.id, label: lesson.title }))}>
            {bookmarked ? '★ Bookmarked' : '☆ Bookmark lesson'}
          </button>
        )}
      </header>

      <LessonPlayer
        key={lesson.id + (sceneId ?? '')}
        lesson={lesson}
        initialTime={initialTime}
        reducedMotion={reduced}
        narration={settings.narration}
        captions={settings.captions}
        captionSize={settings.captionSize}
        rate={settings.rate}
        onSettingsChange={(p) => setSettings(p)}
        onProgress={persist ? (t, sid) => update((s) => recordPosition(s, lesson.id, t, sid)) : undefined}
        onEnded={persist ? () => update((s) => markWatched(s, lesson.id)) : undefined}
        onGoToQuiz={() => document.getElementById('quiz')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })}
        isSceneBookmarked={persist ? (sid) => isBookmarked(state, lesson.id, sid) : undefined}
        onToggleSceneBookmark={persist ? (sid, t, title) => update((s) => toggleBookmark(s, { lessonId: lesson.id, sceneId: sid, t, label: title })) : undefined}
      />
      {lesson.reviewer.status !== 'mapped' && (
        <div className="notice notice-warn" role="note">
          <strong>Not mapped to your reviewer.</strong> {lesson.reviewer.note}
        </div>
      )}
      <p className="small muted kbd-help">Keyboard: Space play/pause · ←/→ 5 s · J/L 10 s · N/P scene · C captions · M mute · T transcript · F full screen</p>

      <section className="panel">
        <h2>Before you start</h2>
        <div className="grid-2">
          <div>
            <h3 className="h3">You will be able to</h3>
            <ul>{lesson.objectives.map((o) => <li key={o}>{o}</li>)}</ul>
          </div>
          <div>
            <h3 className="h3">Prerequisites</h3>
            <ul>
              {lesson.prerequisites.map((p) => {
                const pl = lessonOf.get(p);
                return <li key={p}>{pl ? <a href={`#/lesson/${pl.lesson.id}`}>{conceptTitle(p)}</a> : <>{conceptTitle(p)} <span className="small muted">(lesson pending)</span></>}</li>;
              })}
            </ul>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Understand it</h2>
        <dl className="five-q">
          <div><dt>1. What is happening?</dt><dd>{ex.what}</dd></div>
          <div><dt>2. Why does it happen?</dt><dd>{ex.why}</dd></div>
          <div><dt>3. What does the lab measure or observe?</dt><dd>{ex.measure}</dd></div>
          <div><dt>4. How is it different from similar concepts?</dt><dd>{ex.differs}</dd></div>
          <div><dt>5. How could an exam test it?</dt><dd>{ex.examAngle}</dd></div>
        </dl>
      </section>

      <section className="panel">
        <h2>Exam distinctions</h2>
        {lesson.comparisons.map((c) => (
          <div key={c.id} className="compare">
            <h3 className="h3">{c.title}</h3>
            <div className="compare-cols">
              <div className="compare-col tone-a"><h4>{c.left.label}</h4><ul>{c.left.points.map((p) => <li key={p}>{p}</li>)}</ul></div>
              <div className="compare-col tone-b"><h4>{c.right.label}</h4><ul>{c.right.points.map((p) => <li key={p}>{p}</li>)}</ul></div>
            </div>
            <p className="distinguisher"><strong>The tell:</strong> {c.distinguisher}</p>
          </div>
        ))}
      </section>

      <section className="panel">
        <h2>Memory aid</h2>
        <p className="mnemonic">{lesson.mnemonic.text}</p>
        <p>{lesson.mnemonic.explanation}</p>
        <div className="notice"><strong>Where the analogy stops matching the science:</strong> {lesson.mnemonic.limitation}</div>
        <h3 className="h3">About the cartoons</h3>
        <ul>{lesson.analogyLimitations.map((a) => <li key={a}>{a}</li>)}</ul>
        <p className="small muted">{lesson.morphology.note}</p>
      </section>

      <div id="quiz" tabIndex={-1}>
        <Quiz items={quizItems} record={persist} />
      </div>

      <section className="panel takeaway-panel">
        <h2>Takeaway</h2>
        <p className="takeaway">{lesson.takeaway}</p>
      </section>

      <section className="panel" aria-labelledby="evidence-h">
        <h2 id="evidence-h">Evidence &amp; accuracy</h2>
        <p className="small">
          Verification: <strong>{lesson.verification.status}</strong> · Human expert review: <strong>{lesson.verification.humanExpertReview ? `yes (${lesson.verification.reviewer})` : 'not yet'}</strong>. {lesson.verification.notes}
        </p>
        {entry.reviewNeeds.length > 0 && (
          <ul className="small">{entry.reviewNeeds.map((n) => <li key={n}>{n}</li>)}</ul>
        )}
        {(['checked', 'analogy', 'pending'] as const).map((s) => claimsBy(s).length > 0 && (
          <details key={s} className="claims" open={s === 'pending'}>
            <summary><span className={`claim-dot claim-${s}`} aria-hidden="true" /> {CLAIM_LABEL[s]} ({claimsBy(s).length})</summary>
            <ul>
              {claimsBy(s).map((c) => (
                <li key={c.id}>
                  {c.text}
                  {c.refs?.length ? <span className="small muted"> — {c.refs.join(', ')}</span> : null}
                  {c.note && <div className="small muted">{c.note}</div>}
                </li>
              ))}
            </ul>
          </details>
        ))}
        {lesson.accuracyFlags.length > 0 && (
          <>
            <h3 className="h3">Accuracy flags</h3>
            <ul>
              {lesson.accuracyFlags.map((f) => (
                <li key={f.id}><span className="pill pill-draft">{f.kind}</span> <span className="pill pill-muted">{f.status}</span> {f.issue}{f.resolution && <> — {f.resolution}</>}</li>
              ))}
            </ul>
          </>
        )}
        <h3 className="h3">References</h3>
        <ol className="refs">
          {lesson.references.map((r) => (
            <li key={r.id} id={`ref-${r.id}`}>
              <span className="small muted">[{r.id}]</span> {r.citation}
              {r.doi && <> doi:<a href={`https://doi.org/${r.doi}`} rel="noreferrer" target="_blank">{r.doi}</a></>}
              {r.url && <> · <a href={r.url} rel="noreferrer" target="_blank">open</a></>}
              {r.license && <span className="small muted"> · {r.license}</span>}
              <div className="small">{r.consulted ? '✓ Consulted for this lesson' : '✗ Not consulted — listed for future verification'} · {r.usedFor}</div>
            </li>
          ))}
        </ol>
        <p className="small muted">Source reviewer: {lesson.reviewer.status === 'mapped' ? `Chapter ${lesson.reviewer.chapter}, pages ${lesson.reviewer.pages}` : 'not mapped'}.</p>
      </section>
    </article>
  );
}
