import { useEffect, useRef } from 'react';
import { href, useRoute } from './router';
import { useSettings, useThemeEffect } from './state/hooks';
import { tracks } from './content';
import { Dashboard } from './pages/Dashboard';
import { CurriculumPage } from './pages/Curriculum';
import { LessonPage } from './pages/Lesson';
import { ReviewPage } from './pages/Review';
import { CoveragePage } from './pages/Coverage';
import { AuthorPage } from './pages/Author';
import { SettingsPage } from './pages/Settings';
import { NotFound } from './pages/NotFound';

const NAV = [
  { path: '/', key: '', label: 'Home', icon: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' },
  { path: '/curriculum', key: 'curriculum', label: 'Curriculum', icon: 'M4 6H2v14a2 2 0 0 0 2 2h14v-2H4V6zm16-4H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z' },
  { path: '/review', key: 'review', label: 'Review', icon: 'M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z' },
  { path: '/coverage', key: 'coverage', label: 'Coverage', icon: 'M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z' },
  { path: '/author', key: 'author', label: 'Author', icon: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z' },
  { path: '/settings', key: 'settings', label: 'Settings', icon: 'M19.14 12.94a7.07 7.07 0 0 0 0-1.88l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.61-.22l-2.39.96a7 7 0 0 0-1.62-.94l-.36-2.54A.5.5 0 0 0 13.9 2h-3.84a.5.5 0 0 0-.49.42l-.36 2.54a7 7 0 0 0-1.62.94l-2.39-.96a.5.5 0 0 0-.61.22L2.67 8.48a.5.5 0 0 0 .12.64l2.03 1.58a7.07 7.07 0 0 0 0 1.88l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.39.3.61.22l2.39-.96c.5.38 1.04.7 1.62.94l.36 2.54c.05.24.25.42.49.42h3.84c.24 0 .45-.18.49-.42l.36-2.54a7 7 0 0 0 1.62-.94l2.39.96c.22.08.48 0 .61-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z' },
];

export function App() {
  useThemeEffect();
  const { path, query } = useRoute();
  const [settings, setSettings] = useSettings();
  const mainRef = useRef<HTMLElement>(null);
  const section = path[0] ?? '';

  // Move focus to the page on navigation (screen readers announce the new page).
  useEffect(() => {
    mainRef.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [path.join('/')]);

  let page;
  switch (section) {
    case '':
      page = <Dashboard />;
      break;
    case 'curriculum':
      page = <CurriculumPage initialQuery={query.get('q') ?? ''} />;
      break;
    case 'lesson':
      page = <LessonPage id={path[1] ?? ''} sceneId={query.get('scene') ?? undefined} />;
      break;
    case 'review':
      page = <ReviewPage />;
      break;
    case 'coverage':
      page = <CoveragePage />;
      break;
    case 'author':
      page = <AuthorPage />;
      break;
    case 'settings':
      page = <SettingsPage />;
      break;
    default:
      page = <NotFound />;
  }

  return (
    <div className="app">
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); mainRef.current?.focus(); }}>Skip to content</a>
      <header className="topbar">
        <a className="brand" href={href('/')} aria-label="MEMORY LAB home">
          <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="var(--rbc)" /><circle cx="16" cy="16" r="6" fill="var(--rbc-pallor)" /></svg>
          <span>MEMORY <b>LAB</b></span>
        </a>
        <nav className="topnav" aria-label="Main">
          {NAV.map((n) => (
            <a key={n.key} href={href(n.path)} aria-current={section === n.key ? 'page' : undefined}>{n.label}</a>
          ))}
        </nav>
        <label className="track-picker">
          <span className="sr-only">Exam track</span>
          <select value={settings.track} onChange={(e) => setSettings({ track: e.target.value as typeof settings.track })} aria-label="Exam track">
            <option value="both">All tracks</option>
            {tracks.map((t) => (
              <option key={t.id} value={t.id}>{t.shortName}</option>
            ))}
          </select>
        </label>
      </header>
      <main id="main" ref={mainRef} tabIndex={-1}>
        {page}
      </main>
      <nav className="bottomnav" aria-label="Main (mobile)">
        {NAV.filter((n) => n.key !== 'author').map((n) => (
          <a key={n.key} href={href(n.path)} aria-current={section === n.key ? 'page' : undefined}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d={n.icon} fill="currentColor" /></svg>
            <span>{n.label}</span>
          </a>
        ))}
      </nav>
      <footer className="footer">
        <p>
          MEMORY LAB is an independent study aid. It is not affiliated with or endorsed by ASCP, the ASCP Board of Certification, or the PRC.
          Lessons show their verification status; none has had human expert review yet.
        </p>
      </footer>
    </div>
  );
}
