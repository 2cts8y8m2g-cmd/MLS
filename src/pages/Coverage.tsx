import { curriculum, lessonEntries, reviewer, tracks } from '../content';
import { conceptStatus, coverage } from '../logic/curriculum';
import { useSettings } from '../state/hooks';
import { Panel, StatusPill, TrackTags } from '../components/bits';
import { href } from '../router';

export function CoveragePage() {
  const [settings] = useSettings();
  const cov = coverage(curriculum, lessonEntries, settings.track);
  const sum = (k: 'total' | 'complete' | 'needsReview' | 'draft' | 'pending' | 'mappedToReviewer') => cov.reduce((a, d) => a + d[k], 0);

  return (
    <div className="page">
      <h1>Coverage &amp; review status</h1>
      <p className="lead">An honest account of what has been built, what is pending, and what still needs checking. Titles, placeholders and drafts never count as complete.</p>

      <Panel title="Source reviewer" id="src">
        <p><strong>{reviewer.received ? 'Received' : 'Not received.'}</strong> {reviewer.statement}</p>
        {reviewer.chapters.length === 0 && <p className="small muted">Chapter checklist: none yet — it will be created from the reviewer's table of contents when the file is provided.</p>}
      </Panel>

      <dl className="stats stats-wide">
        <div><dt>Concepts in inventory</dt><dd>{sum('total')}</dd></div>
        <div><dt>Complete lessons</dt><dd>{sum('complete')}</dd></div>
        <div><dt>…requiring review</dt><dd>{sum('needsReview')}</dd></div>
        <div><dt>Drafts</dt><dd>{sum('draft')}</dd></div>
        <div><dt>Pending</dt><dd>{sum('pending')}</dd></div>
        <div><dt>Mapped to reviewer</dt><dd>{sum('mappedToReviewer')}</dd></div>
      </dl>

      <Panel title="By domain" id="domains">
        <div className="table-scroll">
          <table className="table">
            <thead><tr><th scope="col">Domain</th><th scope="col">Concepts</th><th scope="col">Complete</th><th scope="col">Requires review</th><th scope="col">Draft</th><th scope="col">Pending</th></tr></thead>
            <tbody>
              {cov.map((d) => (
                <tr key={d.domain.id}>
                  <th scope="row">{d.domain.title} <TrackTags tracks={d.domain.tracks} /></th>
                  <td>{d.total}</td><td>{d.complete}</td><td>{d.needsReview}</td><td>{d.draft}</td><td>{d.pending}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Lessons" id="lessons">
        {lessonEntries.map((e) => (
          <details key={e.lesson.id} className="lesson-status" open>
            <summary>
              {e.lesson.title}{' '}
              <span className={`pill ${e.validation.complete ? (e.reviewNeeds.length ? 'pill-complete-needs-review' : 'pill-complete') : 'pill-draft'}`}>
                {e.validation.complete ? (e.reviewNeeds.length ? 'Complete · requires review' : 'Complete') : 'Incomplete'}
              </span>
            </summary>
            <p><a href={href(`/lesson/${e.lesson.id}`)}>Open lesson</a> · <span className="small muted">{e.lesson.id}.json</span></p>
            <ul className="checklist">
              {e.validation.checklist.map((c) => (
                <li key={c.id} className={c.ok ? 'ok' : 'no'}>{c.ok ? '✓' : '✗'} {c.label}{c.detail && <span className="small muted"> — {c.detail}</span>}</li>
              ))}
              {e.validation.errors.map((err) => <li key={err} className="no">✗ {err}</li>)}
            </ul>
            {e.reviewNeeds.length > 0 && (
              <>
                <h4>Requires review</h4>
                <ul>{e.reviewNeeds.map((n) => <li key={n}>{n}</li>)}</ul>
              </>
            )}
            <p className="small">Claims: {e.lesson.claims.filter((c) => c.status === 'checked').length} checked · {e.lesson.claims.filter((c) => c.status === 'pending').length} pending · {e.lesson.claims.filter((c) => c.status === 'analogy').length} analogy</p>
          </details>
        ))}
      </Panel>

      <Panel title="Exam outline verification" id="tracks">
        {tracks.map((t) => (
          <div key={t.id} className="track-verify">
            <h3 className="h3">{t.name}</h3>
            <ul>
              {t.outline.map((o) => (
                <li key={o.url}>
                  <span className={`pill ${o.verified ? 'pill-complete' : 'pill-draft'}`}>{o.verified ? 'verified' : 'unverified'}</span>{' '}
                  <a href={o.url} target="_blank" rel="noreferrer">{o.title}</a> <span className="small muted">({o.checkedAt})</span>
                  <div className="small">{o.verificationNote}</div>
                </li>
              ))}
            </ul>
            <ul className="small">{t.trackOnlyNotes.map((n) => <li key={n}>{n}</li>)}</ul>
          </div>
        ))}
      </Panel>

      <Panel title="Concept checklist" id="checklist">
        {[...curriculum.domains].sort((a, b) => a.sequence - b.sequence).map((d) => (
          <details key={d.id} className="domain">
            <summary><span className="domain-seq">{d.sequence}</span><span className="domain-title">{d.title}</span></summary>
            <ul className="concepts">
              {d.topics.flatMap((t) => t.concepts).map((k) => (
                <li key={k.id} className="concept">
                  <div className="concept-main">{k.title}</div>
                  <div className="concept-meta"><StatusPill status={conceptStatus(k.id, lessonEntries)} /><span className="small muted">{k.reviewerRef ? `p. ${k.reviewerRef.pages}` : 'not mapped'}</span></div>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </Panel>
    </div>
  );
}
