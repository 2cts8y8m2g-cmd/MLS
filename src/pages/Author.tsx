import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { knownIds, lessonEntries } from '../content';
import { reviewNeeds, validateLesson } from '../schema/validate';
import { lessonTemplate } from '../schema/template';
import type { Lesson } from '../schema/types';
import { SCENE_KIND_LABELS, VISUAL_TYPES } from '../schema/types';
import { formatTime } from '../engine/timeline';
import { LessonView } from '../components/LessonView';

const DRAFT_KEY = 'memorylab:author-draft';

function loadDraft(): string | null {
  try {
    return window.localStorage.getItem(DRAFT_KEY);
  } catch {
    return null;
  }
}

/**
 * Authoring & preview: edit lesson JSON, see validation and the completeness
 * checklist live, and preview exactly what learners will get. Drafts stay in this
 * browser; to publish, download the JSON into /content/lessons and run `npm run validate`.
 */
export function AuthorPage() {
  const [text, setText] = useState(() => loadDraft() ?? JSON.stringify(lessonEntries[0]?.lesson ?? lessonTemplate(), null, 2));
  const [debounced, setDebounced] = useState(text);
  const [preview, setPreview] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(text), 400);
    try {
      window.localStorage.setItem(DRAFT_KEY, text);
    } catch {
      /* storage unavailable — draft lives only in memory */
    }
    return () => clearTimeout(id);
  }, [text]);

  const parsed = useMemo(() => {
    try {
      return { value: JSON.parse(debounced) as unknown, error: null };
    } catch (e) {
      return { value: null, error: (e as Error).message };
    }
  }, [debounced]);
  const result = useMemo(() => (parsed.value ? validateLesson(parsed.value, knownIds) : null), [parsed.value]);
  const lesson = parsed.value as Lesson | null;
  const playable = !!lesson && !!result && result.errors.length === 0;

  const download = () => {
    const name = (lesson && typeof lesson.id === 'string' ? lesson.id : 'lesson') + '.json';
    const blob = new Blob([text.endsWith('\n') ? text : text + '\n'], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const format = () => {
    if (parsed.value) setText(JSON.stringify(parsed.value, null, 2));
  };

  return (
    <div className="page author">
      <h1>Author &amp; preview</h1>
      <p className="lead">Lessons are data, not code. Edit the JSON, check it against the schema, and preview it in the real player. Nothing here changes the published lessons.</p>
      <details className="panel">
        <summary><strong>How to publish a lesson</strong></summary>
        <ol>
          <li>Start from an existing lesson or the template below.</li>
          <li>Fill every teaching beat: hook, normal process, what changes, lab connection, exam distinction, memory aid, understanding check, takeaway.</li>
          <li>Use only the visual types listed below; animate them with <code>keys</code> (times are seconds from the scene start).</li>
          <li>Record every scientific claim in <code>claims</code> as <code>checked</code> (with a consulted reference), <code>pending</code>, or <code>analogy</code>.</li>
          <li>Download the JSON, save it to <code>content/lessons/</code>, then run <code>npm run validate</code> and <code>npm run coverage:report</code>.</li>
        </ol>
        <p className="small">Visual types: {VISUAL_TYPES.map((v) => <code key={v}>{v}</code>).reduce<ReactNode[]>((a, c, i) => (i ? [...a, ', ', c] : [c]), [])}. See <code>docs/CONTENT_GUIDE.md</code> for each type's properties.</p>
      </details>

      <div className="btn-row-wrap">
        <label>
          <span className="sr-only">Load lesson</span>
          <select aria-label="Load a lesson into the editor" defaultValue="" onChange={(e) => {
            const v = e.target.value;
            if (!v) return;
            if (v === '__template') setText(JSON.stringify(lessonTemplate(), null, 2));
            else setText(JSON.stringify(lessonEntries.find((x) => x.lesson.id === v)?.lesson, null, 2));
            e.target.value = '';
          }}>
            <option value="">Load…</option>
            <option value="__template">New lesson from template</option>
            {lessonEntries.map((e) => <option key={e.lesson.id} value={e.lesson.id}>{e.lesson.title}</option>)}
          </select>
        </label>
        <button className="btn btn-ghost" onClick={format} disabled={!parsed.value}>Format JSON</button>
        <button className="btn" onClick={download} disabled={!parsed.value}>Download JSON</button>
        <label className="toggle"><input type="checkbox" checked={preview} onChange={(e) => setPreview(e.target.checked)} /> Live preview</label>
      </div>

      <div className="author-grid">
        <div className="author-editor">
          <label htmlFor="lesson-json" className="sr-only">Lesson JSON</label>
          <textarea id="lesson-json" spellCheck={false} value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <div className="author-status" aria-live="polite" tabIndex={0} role="region" aria-label="Validation results">
          {parsed.error && <div className="notice notice-bad"><strong>JSON error:</strong> {parsed.error}</div>}
          {result && (
            <>
              <p className={`verdict ${result.complete ? 'good' : 'bad'}`}>
                {result.complete ? '✓ Complete — counts toward coverage.' : result.errors.length ? `✗ ${result.errors.length} structural error(s) — cannot play.` : '△ Playable draft — not yet complete.'}
              </p>
              {result.errors.length > 0 && <ul className="checklist">{result.errors.map((e) => <li key={e} className="no">✗ {e}</li>)}</ul>}
              <ul className="checklist">
                {result.checklist.map((c) => <li key={c.id} className={c.ok ? 'ok' : 'no'}>{c.ok ? '✓' : '✗'} {c.label}{c.detail && <span className="small muted"> — {c.detail}</span>}</li>)}
              </ul>
              {playable && reviewNeeds(lesson!).length > 0 && (
                <>
                  <h3 className="h3">Requires review</h3>
                  <ul className="small">{reviewNeeds(lesson!).map((n) => <li key={n}>{n}</li>)}</ul>
                </>
              )}
            </>
          )}
          {playable && (
            <>
              <h3 className="h3">Timeline</h3>
              <div className="table-scroll">
                <table className="table small">
                  <thead><tr><th scope="col">Scene</th><th scope="col">Time</th><th scope="col">Cues</th><th scope="col">Objects</th></tr></thead>
                  <tbody>
                    {lesson!.scenes.map((s) => (
                      <tr key={s.id}><th scope="row">{SCENE_KIND_LABELS[s.kind] ?? s.kind}</th><td>{formatTime(s.start)}–{formatTime(s.end)}</td><td>{s.cues.length}</td><td>{s.objects.length}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {preview && playable && (
        <section className="author-preview" aria-label="Preview">
          <h2>Preview</h2>
          <p className="small muted">Preview mode: progress, bookmarks and quiz answers are not saved.</p>
          <LessonView entry={{ lesson: lesson!, validation: result!, reviewNeeds: reviewNeeds(lesson!) }} persist={false} />
        </section>
      )}
    </div>
  );
}
