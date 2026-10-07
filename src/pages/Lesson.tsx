import { lessonById, conceptTitle, domainTitle, topicTitle } from '../content';
import { LessonView } from '../components/LessonView';
import { NotFound } from './NotFound';

export function LessonPage({ id, sceneId }: { id: string; sceneId?: string }) {
  const entry = lessonById.get(id);
  if (!entry) return <NotFound what="lesson" />;
  return (
    <div className="page lesson-page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="#/curriculum">Curriculum</a> › <span>{domainTitle(entry.lesson.domain)}</span> › <span>{topicTitle(entry.lesson.topic)}</span>
      </nav>
      <LessonView entry={entry} sceneId={sceneId} persist />
      <p className="small muted">Concepts: {entry.lesson.conceptIds.map(conceptTitle).join('; ')}</p>
    </div>
  );
}
