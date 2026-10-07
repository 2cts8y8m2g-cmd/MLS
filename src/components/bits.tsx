import type { ReactNode } from 'react';
import type { LessonEntry, ConceptStatus } from '../logic/curriculum';
import { domainTitle } from '../content';
import { href } from '../router';
import type { AppState } from '../state/model';

export const STATUS_LABEL: Record<ConceptStatus, string> = {
  complete: 'Complete',
  'complete-needs-review': 'Complete · requires review',
  draft: 'Draft',
  pending: 'Pending',
};

export function StatusPill({ status }: { status: ConceptStatus }) {
  return <span className={`pill pill-${status}`}>{STATUS_LABEL[status]}</span>;
}

export function TrackTags({ tracks }: { tracks: string[] }) {
  return (
    <span className="tags">
      {tracks.map((t) => (
        <span key={t} className={`tag tag-${t}`}>{t === 'ascp' ? 'ASCP/ASCPi' : 'PH MTLE'}</span>
      ))}
    </span>
  );
}

export function LessonCard({ entry, state, reason }: { entry: LessonEntry; state: AppState; reason?: string }) {
  const p = state.lessons[entry.lesson.id];
  const pct = p ? Math.min(100, Math.round((p.lastT / entry.lesson.duration) * 100)) : 0;
  return (
    <a className="lesson-card" href={href(`/lesson/${entry.lesson.id}`)}>
      <span className="lesson-card-domain">{domainTitle(entry.lesson.domain)}</span>
      <strong className="lesson-card-title">{entry.lesson.title}</strong>
      {reason && <span className="lesson-card-reason">{reason}</span>}
      <span className="lesson-card-meta">
        <TrackTags tracks={entry.lesson.tracks} />
        <span>{Math.round(entry.lesson.duration / 60 * 10) / 10} min</span>
        {p?.watched ? <span className="pill pill-complete">Watched</span> : pct > 0 ? <span>{pct}% watched</span> : null}
      </span>
      <span className="progress" aria-hidden="true"><span style={{ width: `${p?.watched ? 100 : pct}%` }} /></span>
    </a>
  );
}

export function Panel({ title, children, actions, id }: { title: string; children: ReactNode; actions?: ReactNode; id?: string }) {
  return (
    <section className="panel" id={id} aria-labelledby={id ? `${id}-h` : undefined}>
      <div className="panel-head">
        <h2 id={id ? `${id}-h` : undefined}>{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function Meter({ value, label }: { value: number; label: string }) {
  const pct = Math.round(value * 100);
  return (
    <span className="meter" role="img" aria-label={`${label}: ${pct}%`}>
      <span className="meter-fill" style={{ width: `${pct}%` }} data-level={pct < 50 ? 'low' : pct < 70 ? 'mid' : 'high'} />
    </span>
  );
}
