import { useRef, useState } from 'react';
import { narrationSupported } from '../player/narration';
import { SPEEDS } from '../player/LessonPlayer';
import { useReducedMotion, useSettings } from '../state/hooks';
import { getState, isStorageAvailable, replaceState } from '../state/store';
import { emptyState, sanitizeState } from '../state/model';
import { tracks } from '../content';

export function SettingsPage() {
  const [s, set] = useSettings();
  const reduced = useReducedMotion();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');

  const exportData = () => {
    const blob = new Blob([JSON.stringify(getState(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `memory-lab-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const importData = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      const clean = sanitizeState(data);
      if (data?.version !== 1) throw new Error('Not a MEMORY LAB progress file.');
      replaceState(clean);
      setMsg(`Imported ${clean.attempts.length} answers, ${Object.keys(clean.lessons).length} lessons and ${clean.bookmarks.length} bookmarks.`);
    } catch (e) {
      setMsg(`Import failed: ${(e as Error).message}`);
    }
  };

  return (
    <div className="page narrow">
      <h1>Settings</h1>

      <section className="panel">
        <h2>Study track</h2>
        <fieldset className="radio-list">
          <legend className="sr-only">Exam track</legend>
          <label><input type="radio" name="trk" checked={s.track === 'both'} onChange={() => set({ track: 'both' })} /> All tracks</label>
          {tracks.map((t) => (
            <label key={t.id}><input type="radio" name="trk" checked={s.track === t.id} onChange={() => set({ track: t.id })} /> {t.name}</label>
          ))}
        </fieldset>
      </section>

      <section className="panel">
        <h2>Playback</h2>
        <fieldset className="radio-list">
          <legend>Motion</legend>
          {(['system', 'on', 'off'] as const).map((v) => (
            <label key={v}><input type="radio" name="rm" checked={s.reducedMotion === v} onChange={() => set({ reducedMotion: v })} /> {v === 'system' ? 'Follow my device setting' : v === 'on' ? 'Reduced motion (step-by-step stills)' : 'Full animation'}</label>
          ))}
          <p className="small muted">Currently: {reduced ? 'reduced motion — visuals change in steps synchronized with captions, with no tweening or pulsing.' : 'full animation.'}</p>
        </fieldset>
        <label className="toggle">
          <input type="checkbox" checked={s.narration} disabled={!narrationSupported()} onChange={(e) => set({ narration: e.target.checked })} />
          Narration (reads captions aloud using your browser's built-in voice — no account or internet service needed)
        </label>
        {!narrationSupported() && <p className="small warn-text">This browser has no speech synthesis. Captions and animations still work.</p>}
        <label className="toggle"><input type="checkbox" checked={s.captions} onChange={(e) => set({ captions: e.target.checked })} /> Captions</label>
        <label className="field">Caption size
          <select value={s.captionSize} onChange={(e) => set({ captionSize: e.target.value as typeof s.captionSize })}>
            <option value="m">Medium</option><option value="l">Large</option><option value="xl">Extra large</option>
          </select>
        </label>
        <label className="field">Default speed
          <select value={s.rate} onChange={(e) => set({ rate: Number(e.target.value) })}>
            {SPEEDS.map((v) => <option key={v} value={v}>{v}×</option>)}
          </select>
        </label>
      </section>

      <section className="panel">
        <h2>Appearance</h2>
        <label className="field">Theme
          <select value={s.theme} onChange={(e) => set({ theme: e.target.value as typeof s.theme })}>
            <option value="system">Match device</option><option value="light">Light</option><option value="dark">Dark</option>
          </select>
        </label>
      </section>

      <section className="panel">
        <h2>Your data</h2>
        <p className="small">Progress, answers and bookmarks are stored only in this browser{isStorageAvailable() ? '' : ' — storage is currently blocked, so progress will be lost when you close the tab'}. Export a file to move them to another device.</p>
        <div className="btn-row-wrap">
          <button className="btn btn-ghost" onClick={exportData}>Export progress</button>
          <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>Import progress</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} />
          <button className="btn btn-danger" onClick={() => { if (confirm('Erase all progress, answers and bookmarks in this browser?')) { replaceState({ ...emptyState(), settings: getState().settings }); setMsg('Progress reset.'); } }}>Reset progress</button>
        </div>
        {msg && <p role="status" className="small">{msg}</p>}
      </section>
    </div>
  );
}
