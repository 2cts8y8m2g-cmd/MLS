import { curriculum, lessonEntries, reviewer, reviewerReview, tracks } from '../content';
import { conceptStatus, coverage } from '../logic/curriculum';
import { useSettings } from '../state/hooks';
import { Panel, StatusPill, TrackTags } from '../components/bits';
import { href } from '../router';
import { formatLocation } from '../logic/locate';

export function CoveragePage() {
  const [settings] = useSettings();
  const cov = coverage(curriculum, lessonEntries, settings.track);
  const sum = (k: 'total' | 'complete' | 'needsReview' | 'draft' | 'pending' | 'mappedToReviewer') => cov.reduce((a, d) => a + d[k], 0);

  return (
    <div className="page">
      <h1>Coverage &amp; review status</h1>
      <p className="lead">An honest account of what has been built, what is pending, and what still needs checking. Titles, placeholders and drafts never count as complete.</p>

      <Panel title="Source reviewer" id="src">
        {reviewer.received ? (
          <>
            <p><strong>{reviewer.title}</strong> — {reviewer.author}. {reviewer.edition}. {reviewer.format}.</p>
            <p className="small">{reviewer.statement}</p>
            <p className="small"><strong>Accessible:</strong> {reviewer.pagesAccessible}</p>
            {reviewer.selfReportedReview && <div className="notice"><strong>Reviewer's own review status:</strong> {reviewer.selfReportedReview}</div>}
            {reviewer.backMatter && (
              <ul className="small">
                {reviewer.backMatter.map((b) => <li key={b.name}><strong>{b.name}</strong> — {b.description}. <em>{b.usedInApp}</em></li>)}
              </ul>
            )}
          </>
        ) : (
          <p><strong>Not received.</strong> {reviewer.statement}</p>
        )}
      </Panel>

      <dl className="stats stats-wide">
        <div><dt>Concepts in inventory</dt><dd>{sum('total')}</dd></div>
        <div><dt>Complete lessons</dt><dd>{sum('complete')}</dd></div>
        <div><dt>…requiring review</dt><dd>{sum('needsReview')}</dd></div>
        <div><dt>Drafts</dt><dd>{sum('draft')}</dd></div>
        <div><dt>Pending</dt><dd>{sum('pending')}</dd></div>
        <div><dt>From the reviewer</dt><dd>{sum('mappedToReviewer')}</dd></div>
      </dl>

      {reviewer.chapters.length > 0 && (
        <Panel title="Chapter checklist" id="chapters">
          <p className="small muted">Every reviewer chapter, in order. “Taught” counts concepts covered by a complete lesson; drafts and placeholders never count.</p>
          <div className="table-scroll">
            <table className="table small">
              <thead><tr><th scope="col">Chapter</th><th scope="col">Concepts</th><th scope="col">Taught</th><th scope="col">Lessons</th><th scope="col">Hits / tables / traps</th><th scope="col">Reviewer exam Qs</th><th scope="col">Accuracy flags</th></tr></thead>
              <tbody>
                {reviewer.chapters.map((c) => {
                  const topic = curriculum.domains.flatMap((d) => d.topics).find((t) => t.reviewerChapter === c.n);
                  const concepts = topic?.concepts ?? [];
                  const taught = concepts.filter((k) => conceptStatus(k.id, lessonEntries).startsWith('complete')).length;
                  const ls = lessonEntries.filter((e) => e.validation.complete && e.lesson.conceptIds.some((id) => concepts.some((k) => k.id === id)));
                  const flags = reviewerReview.flags.filter((f) => f.location.chapter === c.n && f.status !== 'resolved').length;
                  return (
                    <tr key={c.id} className={taught ? 'row-done' : ''}>
                      <th scope="row">{c.n}. {c.title.toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase())} <span className="small muted">Part {c.part}</span></th>
                      <td>{concepts.length}</td>
                      <td>{taught}</td>
                      <td>{ls.map((e) => <a key={e.lesson.id} href={href(`/lesson/${e.lesson.id}`)}>{e.lesson.title}</a>)}</td>
                      <td>{c.counts.highYield} / {c.counts.tables} ({c.counts.tableRows} rows) / {c.counts.traps}</td>
                      <td>{c.counts.simulatorQuestions}</td>
                      <td>{flags || ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <Panel title="Reviewer accuracy register" id="reviewer-flags">
        <p className="small">{reviewerReview.statement}</p>
        <p className="small muted">{reviewerReview.scan.note}</p>
        <ul className="flag-list">
          {reviewerReview.flags.map((f) => (
            <li key={f.id}>
              <span className={`pill ${f.status === 'verified-issue' ? 'pill-draft' : f.status === 'resolved' ? 'pill-complete' : 'pill-muted'}`}>{f.status}</span>{' '}
              <span className="pill pill-muted">{f.kind}</span>{' '}
              <strong>{formatLocation(f.location)}</strong> — {f.issue}
              <div className="small"><em>In the app:</em> {f.appAction}</div>
              {f.evidence.map((ev) => <div key={ev.citation} className="small muted">Evidence: {ev.url ? <a href={ev.url} target="_blank" rel="noreferrer">{ev.citation}</a> : ev.citation} (checked {ev.checkedAt})</div>)}
            </li>
          ))}
        </ul>
      </Panel>

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
        <p className="small muted">Per Part: every chapter core concept, every gap concept, and every concept with a lesson. Full per-concept detail is in the Curriculum browser and docs/COVERAGE.md.</p>
        {[...curriculum.domains].sort((a, b) => a.sequence - b.sequence).map((d) => (
          <details key={d.id} className="domain">
            <summary><span className="domain-seq">{d.reviewerPart ?? '+'}</span><span className="domain-title">{d.title}</span></summary>
            <ul className="concepts">
              {d.topics.flatMap((t) => t.concepts).filter((k) => conceptStatus(k.id, lessonEntries) !== 'pending' || k.kind === 'core' || k.kind === 'gap').map((k) => (
                <li key={k.id} className="concept">
                  <div className="concept-main">{k.title}</div>
                  <div className="concept-meta"><StatusPill status={conceptStatus(k.id, lessonEntries)} /><span className="small muted">{k.reviewerRef ? formatLocation(k.reviewerRef) : 'not in reviewer'}</span></div>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </Panel>
    </div>
  );
}
