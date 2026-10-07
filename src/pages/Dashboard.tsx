import { curriculum, domainTitle, lessonById, lessonEntries, reviewer, tracks } from '../content';
import { coverage, inTrack } from '../logic/curriculum';
import { recommend } from '../logic/recommend';
import { weakAreas } from '../logic/weak';
import { href } from '../router';
import { useAppState, update } from '../state/store';
import { toggleBookmark } from '../state/model';
import { useSettings } from '../state/hooks';
import { LessonCard, Meter, Panel } from '../components/bits';

export function Dashboard() {
  const state = useAppState();
  const [settings, setSettings] = useSettings();
  const track = settings.track;
  const recs = recommend(curriculum, lessonEntries, state);
  const weak = weakAreas(state.attempts, 'skill').slice(0, 3);
  const available = lessonEntries.filter((e) => e.validation.complete && inTrack(e.lesson.tracks, track));
  const watched = available.filter((e) => state.lessons[e.lesson.id]?.watched).length;
  const answered = state.attempts.length;
  const correct = state.attempts.filter((a) => a.correct).length;
  const cov = coverage(curriculum, lessonEntries, track);
  const totalConcepts = cov.reduce((a, d) => a + d.total, 0);
  const completeConcepts = cov.reduce((a, d) => a + d.complete, 0);
  const activeTracks = track === 'both' ? tracks : tracks.filter((t) => t.id === track);

  return (
    <div className="page">
      <section className="hero">
        <div>
          <h1>Watch it happen. Then you'll remember why.</h1>
          <p className="lead">Animated Medical Laboratory Science lessons: each concept unfolds step by step, then you test yourself with explained answers.</p>
        </div>
        <fieldset className="track-cards">
          <legend>Choose your exam track</legend>
          {[{ id: 'ascp', label: 'MLS(ASCP) / ASCPi', sub: 'US / international certification' }, { id: 'mtle', label: 'PH MTLE', sub: 'Philippine licensure' }, { id: 'both', label: 'Both tracks', sub: 'Shared + track-specific' }].map((o) => (
            <label key={o.id} className={`track-card ${track === o.id ? 'selected' : ''}`}>
              <input type="radio" name="track" value={o.id} checked={track === o.id} onChange={() => setSettings({ track: o.id as typeof track })} />
              <strong>{o.label}</strong>
              <span>{o.sub}</span>
            </label>
          ))}
        </fieldset>
      </section>

      {!reviewer.received && (
        <div className="notice notice-warn" role="note">
          <strong>Source reviewer not yet received.</strong> No lesson is mapped to your reviewer's chapters or pages yet, and the curriculum is a provisional inventory.
          {' '}<a href={href('/coverage')}>See coverage status</a>.
        </div>
      )}

      <div className="grid-2">
        <Panel title="Recommended next" id="recs">
          {recs.length ? (
            <div className="cards">{recs.map((r) => <LessonCard key={r.lessonId} entry={lessonById.get(r.lessonId)!} state={state} reason={r.reason} />)}</div>
          ) : (
            <p className="muted">You've finished every completed lesson for this track. More lessons are pending — see <a href={href('/coverage')}>Coverage</a>.</p>
          )}
        </Panel>

        <Panel title="Your progress" id="progress">
          <dl className="stats">
            <div><dt>Lessons watched</dt><dd>{watched} / {available.length}</dd></div>
            <div><dt>Questions answered</dt><dd>{answered}</dd></div>
            <div><dt>Accuracy</dt><dd>{answered ? `${Math.round((correct / answered) * 100)}%` : '—'}</dd></div>
            <div><dt>Concepts with lessons</dt><dd>{completeConcepts} / {totalConcepts}</dd></div>
          </dl>
          <h3 className="h3">Weak areas</h3>
          {weak.length ? (
            <ul className="weak-list">
              {weak.map((w) => (
                <li key={w.key}>
                  <span>{w.label}</span>
                  <Meter value={w.accuracy} label={w.label} />
                  <span className="small">{Math.round(w.accuracy * 100)}%</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted small">{answered ? 'No weak areas right now — nice work.' : 'Answer lesson questions to see your weak areas here.'}</p>
          )}
          <a className="btn btn-ghost" href={href('/review')}>Open weak-area review</a>
        </Panel>
      </div>

      <Panel title="Bookmarks" id="bookmarks">
        {state.bookmarks.length ? (
          <ul className="bookmark-list">
            {state.bookmarks.map((b) => {
              const e = lessonById.get(b.lessonId);
              return (
                <li key={`${b.lessonId}#${b.sceneId ?? ''}`}>
                  <a href={href(`/lesson/${b.lessonId}${b.sceneId ? `?scene=${b.sceneId}` : ''}`)}>{e?.lesson.title ?? b.lessonId}{b.sceneId ? ` › ${b.label}` : ''}</a>
                  <button className="link-btn" onClick={() => update((s) => toggleBookmark(s, b))} aria-label={`Remove bookmark ${b.label}`}>Remove</button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="muted small">Bookmark a lesson or a single scene from the player to find it here.</p>
        )}
      </Panel>

      {activeTracks.map((t) => (
        <Panel key={t.id} title={`${t.shortName} blueprint`} id={`bp-${t.id}`}>
          <p className="small muted">{t.body}. {t.outline.some((o) => !o.verified) && <strong className="warn-text">Some outline details are unverified — see Coverage.</strong>}</p>
          <table className="table">
            <thead><tr><th scope="col">Exam area</th><th scope="col">Weight</th><th scope="col">Concepts with complete lessons</th></tr></thead>
            <tbody>
              {t.areas.map((a) => {
                const ds = cov.filter((d) => a.domains.includes(d.domain.id));
                const tot = ds.reduce((x, d) => x + d.total, 0);
                const done = ds.reduce((x, d) => x + d.complete, 0);
                return (
                  <tr key={a.name}>
                    <th scope="row">{a.name}<div className="small muted">{a.domains.map(domainTitle).join(' · ')}</div></th>
                    <td>{a.weight}{!a.weightVerified && <span className="pill pill-draft">unverified</span>}</td>
                    <td>{done} / {tot}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      ))}
    </div>
  );
}
