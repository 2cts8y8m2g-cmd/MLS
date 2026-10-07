import { useMemo, useState } from 'react';
import { curriculum, conceptTitle, lessonEntries } from '../content';
import { conceptStatus, inTrack, lessonForConcept, type ConceptStatus } from '../logic/curriculum';
import { href } from '../router';
import { useSettings } from '../state/hooks';
import { useAppState } from '../state/store';
import { StatusPill, TrackTags } from '../components/bits';

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

export function CurriculumPage({ initialQuery }: { initialQuery: string }) {
  const [settings] = useSettings();
  const state = useAppState();
  const [q, setQ] = useState(initialQuery);
  const [status, setStatus] = useState<'all' | ConceptStatus>('all');
  const lessonOf = useMemo(() => lessonForConcept(lessonEntries), []);
  const terms = norm(q).split(/\s+/).filter(Boolean);

  const domains = [...curriculum.domains]
    .sort((a, b) => a.sequence - b.sequence)
    .filter((d) => inTrack(d.tracks, settings.track))
    .map((d) => ({
      ...d,
      topics: d.topics
        .map((t) => ({
          ...t,
          concepts: t.concepts.filter((k) => {
            if (!inTrack(k.tracks, settings.track)) return false;
            if (status !== 'all' && conceptStatus(k.id, lessonEntries) !== status) return false;
            if (!terms.length) return true;
            const lesson = lessonOf.get(k.id)?.lesson;
            const hay = norm([d.title, t.title, k.title, lesson?.title ?? '', lesson?.summary ?? '', lesson ? lesson.scenes.flatMap((s) => s.cues.map((c) => c.text)).join(' ') : ''].join(' '));
            return terms.every((w) => hay.includes(w));
          }),
        }))
        .filter((t) => t.concepts.length),
    }))
    .filter((d) => d.topics.length);
  const count = domains.reduce((a, d) => a + d.topics.reduce((b, t) => b + t.concepts.length, 0), 0);

  return (
    <div className="page">
      <h1>Curriculum</h1>
      <p className="lead">Domains → topics → concepts, in the recommended learning order. Each concept shows whether a complete animated lesson exists.</p>
      <div className="notice" role="note">
        <strong>Provisional inventory.</strong> {curriculum.provenance.statement}
      </div>
      <div className="filters">
        <label className="search">
          <span className="sr-only">Search curriculum</span>
          <input type="search" placeholder="Search concepts and lesson text (e.g. Bombay, IgM, Westgard)" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search curriculum" />
        </label>
        <label>
          <span className="sr-only">Status filter</span>
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label="Filter by status">
            <option value="all">All statuses</option>
            <option value="complete-needs-review">Complete · requires review</option>
            <option value="complete">Complete</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
          </select>
        </label>
        <span className="muted small" aria-live="polite">{count} concept{count === 1 ? '' : 's'}</span>
      </div>

      {domains.map((d) => (
        <details key={d.id} className="domain" open={terms.length > 0 || status !== 'all' || d.topics.some((t) => t.concepts.some((k) => lessonOf.has(k.id)))}>
          <summary>
            <span className="domain-seq">{d.sequence}</span>
            <span className="domain-title">{d.title}</span>
            <TrackTags tracks={d.tracks} />
          </summary>
          {d.topics.map((t) => (
            <div key={t.id} className="topic">
              <h3>{t.title}</h3>
              <ul className="concepts">
                {t.concepts.map((k) => {
                  const s = conceptStatus(k.id, lessonEntries);
                  const lesson = lessonOf.get(k.id)?.lesson;
                  const watched = lesson && state.lessons[lesson.id]?.watched;
                  return (
                    <li key={k.id} className="concept">
                      <div className="concept-main">
                        {lesson ? <a href={href(`/lesson/${lesson.id}`)}>{k.title}</a> : <span>{k.title}</span>}
                        {watched && <span className="pill pill-complete">Watched</span>}
                      </div>
                      <div className="concept-meta">
                        <StatusPill status={s} />
                        {k.tracks.length === 1 && <TrackTags tracks={k.tracks} />}
                        <span className="small muted">{k.reviewerRef ? `Reviewer ${k.reviewerRef.chapter}, p. ${k.reviewerRef.pages}` : 'Not mapped to reviewer'}</span>
                        {k.prerequisites.length > 0 && <span className="small muted">Needs: {k.prerequisites.map(conceptTitle).join('; ')}</span>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </details>
      ))}
      {count === 0 && <p className="muted">No concepts match. Try a different search or status filter.</p>}
    </div>
  );
}
