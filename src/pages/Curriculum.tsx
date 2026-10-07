import { useMemo, useState } from 'react';
import { curriculum, conceptTitle, lessonEntries, reviewerReview } from '../content';
import { conceptStatus, inTrack, lessonForConcept, type ConceptStatus } from '../logic/curriculum';
import type { Concept } from '../schema/types';
import { href } from '../router';
import { useSettings } from '../state/hooks';
import { useAppState } from '../state/store';
import { StatusPill, TrackTags } from '../components/bits';
import { formatLocation } from '../logic/locate';

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

const KIND_LABEL: Record<Concept['kind'], string> = {
  core: 'Core concept',
  hit: 'High-Yield Hit',
  table: 'Table',
  figure: 'Figure',
  trap: 'Exam Trap',
  special: 'Special section',
  gap: 'Not in reviewer',
};

export function CurriculumPage({ initialQuery }: { initialQuery: string }) {
  const [settings] = useSettings();
  const state = useAppState();
  const [q, setQ] = useState(initialQuery);
  const [status, setStatus] = useState<'all' | ConceptStatus>('all');
  const [kind, setKind] = useState<'all' | 'core' | Concept['kind']>('all');
  const lessonOf = useMemo(() => lessonForConcept(lessonEntries), []);
  const flaggedChapters = useMemo(() => {
    const m = new Map<number, number>();
    for (const f of reviewerReview.flags) if (f.status !== 'resolved') m.set(f.location.chapter, (m.get(f.location.chapter) ?? 0) + 1);
    return m;
  }, []);
  const terms = norm(q).split(/\s+/).filter(Boolean);
  const filtering = terms.length > 0 || status !== 'all' || kind !== 'all';

  const domains = useMemo(
    () =>
      [...curriculum.domains]
        .sort((a, b) => a.sequence - b.sequence)
        .filter((d) => inTrack(d.tracks, settings.track))
        .map((d) => ({
          ...d,
          topics: d.topics
            .map((t) => ({
              ...t,
              concepts: t.concepts.filter((k) => {
                if (!inTrack(k.tracks, settings.track)) return false;
                if (kind !== 'all' && k.kind !== kind) return false;
                if (status !== 'all' && conceptStatus(k.id, lessonEntries) !== status) return false;
                if (!terms.length) return true;
                const lesson = lessonOf.get(k.id)?.lesson;
                const hay = norm([d.title, t.title, k.title, k.notes ?? '', lesson?.title ?? '', lesson?.summary ?? '', lesson ? lesson.scenes.flatMap((s) => s.cues.map((c) => c.text)).join(' ') : ''].join(' '));
                return terms.every((w) => hay.includes(w));
              }),
            }))
            .filter((t) => t.concepts.length),
        }))
        .filter((d) => d.topics.length),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settings.track, kind, status, q],
  );
  const count = domains.reduce((a, d) => a + d.topics.reduce((b, t) => b + t.concepts.length, 0), 0);

  return (
    <div className="page">
      <h1>Curriculum</h1>
      <p className="lead">Follows your reviewer: Parts → chapters → concepts, in the book's order. Each concept shows where it lives in the reviewer and whether a complete animated lesson teaches it.</p>
      <div className="notice" role="note">
        <strong>{curriculum.provenance.status === 'reviewer-derived' ? 'Built from your reviewer.' : 'Provisional inventory.'}</strong> {curriculum.provenance.statement}{' '}
        {curriculum.provenance.labelNote && <span className="small muted">{curriculum.provenance.labelNote}</span>}
      </div>
      <div className="filters">
        <label className="search">
          <span className="sr-only">Search curriculum</span>
          <input type="search" placeholder="Search concepts and lesson text (e.g. Bombay, CLIA, Westgard)" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search curriculum" />
        </label>
        <label>
          <span className="sr-only">Concept type</span>
          <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} aria-label="Filter by concept type">
            <option value="all">All concept types</option>
            {(Object.keys(KIND_LABEL) as Concept['kind'][]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
          </select>
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

      {domains.map((d) => {
        const domainHasLesson = d.topics.some((t) => t.concepts.some((k) => lessonOf.has(k.id)));
        return (
          <details key={d.id} className="domain" open={filtering || domainHasLesson}>
            <summary>
              <span className="domain-seq">{d.reviewerPart ?? '+'}</span>
              <span className="domain-title">{d.reviewerPart ? `Part ${d.reviewerPart} · ` : ''}{d.title}</span>
              <span className="small muted">{d.topics.length} {d.reviewerPart ? 'chapters' : 'topic'}</span>
              <TrackTags tracks={d.tracks} />
            </summary>
            {d.notes && <p className="small warn-text">{d.notes}</p>}
            {d.topics.map((t) => {
              const done = t.concepts.filter((k) => lessonOf.has(k.id)).length;
              const flags = t.reviewerChapter ? flaggedChapters.get(t.reviewerChapter) ?? 0 : 0;
              return (
                <details key={t.id} className="topic" open={filtering || done > 0}>
                  <summary>
                    <span className="topic-title">{t.title}</span>
                    <span className="small muted">{done}/{t.concepts.length} taught{t.simulatorQuestions ? ` · ${t.simulatorQuestions} reviewer exam Qs` : ''}</span>
                    {flags > 0 && <span className="pill pill-draft">{flags} accuracy flag{flags > 1 ? 's' : ''}</span>}
                  </summary>
                  <ul className="concepts">
                    {t.concepts.map((k) => {
                      const s = conceptStatus(k.id, lessonEntries);
                      const lesson = lessonOf.get(k.id)?.lesson;
                      const watched = lesson && state.lessons[lesson.id]?.watched;
                      return (
                        <li key={k.id} className="concept">
                          <div className="concept-main">
                            <span className={`kind kind-${k.kind}`}>{KIND_LABEL[k.kind]}</span>
                            {lesson ? <a href={href(`/lesson/${lesson.id}`)}>{k.title}</a> : <span>{k.title}</span>}
                            {watched && <span className="pill pill-complete">Watched</span>}
                          </div>
                          <div className="concept-meta">
                            <StatusPill status={s} />
                            {k.tracks.length === 1 && <TrackTags tracks={k.tracks} />}
                            <span className="small muted">{k.reviewerRef ? formatLocation(k.reviewerRef) : 'Not in reviewer'}</span>
                            {k.skills?.length ? <span className="small muted">[{k.skills.join(', ')}]</span> : null}
                            {k.prerequisites.length > 0 && k.kind === 'core' && <span className="small muted">Builds on: {k.prerequisites.map(conceptTitle).join('; ')}</span>}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </details>
              );
            })}
          </details>
        );
      })}
      {count === 0 && <p className="muted">No concepts match. Try a different search or filter.</p>}
    </div>
  );
}
