import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { Lesson } from '../schema/types';
import { SCENE_KIND_LABELS } from '../schema/types';
import { Stage } from '../engine/Stage';
import { allCues, cueAt, formatTime, reducedMotionTime, sceneAt } from '../engine/timeline';
import { cancelSpeech, isSpeaking, narrationSupported, speak } from './narration';

export const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export interface PlayerProps {
  lesson: Lesson;
  initialTime?: number;
  reducedMotion: boolean;
  narration: boolean;
  captions: boolean;
  captionSize: 'm' | 'l' | 'xl';
  rate: number;
  onSettingsChange?: (patch: Partial<{ narration: boolean; captions: boolean; rate: number }>) => void;
  onProgress?: (t: number, sceneId: string) => void;
  onEnded?: () => void;
  onGoToQuiz?: () => void;
  isSceneBookmarked?: (sceneId: string) => boolean;
  onToggleSceneBookmark?: (sceneId: string, t: number, title: string) => void;
}

/**
 * The animated lesson player. A single clock (`t`, in lesson seconds) drives the
 * stage, captions, transcript highlight, scene list and narration, so everything
 * stays synchronized when playing, pausing, seeking or changing speed.
 */
export function LessonPlayer(props: PlayerProps) {
  const { lesson, reducedMotion, narration, captions, captionSize, rate } = props;
  const duration = lesson.duration;
  const [t, setT] = useState(() => Math.min(props.initialTime ?? 0, duration - 0.01));
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [announce, setAnnounce] = useState('');
  // Bumped whenever speech is reset (seek/pause/play) so the current caption is re-spoken.
  const [speechEpoch, setSpeechEpoch] = useState(0);

  const tRef = useRef(t);
  const playingRef = useRef(false);
  const rateRef = useRef(rate);
  const lastSpoken = useRef<string | null>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const transcriptRef = useRef<HTMLOListElement>(null);
  const cbRef = useRef(props);
  cbRef.current = props;

  const speechOn = narration && !muted && narrationSupported();
  const speechOnRef = useRef(speechOn);
  speechOnRef.current = speechOn;
  rateRef.current = rate;

  const cues = useMemo(() => allCues(lesson), [lesson]);
  const { scene, index: sceneIndex } = sceneAt(lesson, t);
  const cue = cueAt(lesson, t);
  const renderT = reducedMotion ? reducedMotionTime(lesson, t) : t;

  const setTime = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(duration, next));
    tRef.current = clamped;
    setT(clamped);
  }, [duration]);

  /* ---------- clock ---------- */
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      let next = tRef.current + dt * rateRef.current;
      // With narration on, hold at the end of a caption until its speech finishes.
      const c = cueAt(lesson, tRef.current);
      let held = false;
      if (speechOnRef.current && c && isSpeaking() && next >= c.end - 0.05) {
        next = Math.max(tRef.current, c.end - 0.05);
        held = true;
      }
      setWaiting(held);
      if (next >= duration) {
        setTime(duration);
        setPlaying(false);
        playingRef.current = false;
        cbRef.current.onEnded?.();
        return;
      }
      setTime(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, lesson, duration, setTime]);

  /* ---------- narration follows the active caption ---------- */
  useEffect(() => {
    if (!playing || !speechOn) return;
    if (cue && lastSpoken.current !== cue.id) {
      lastSpoken.current = cue.id;
      speak(cue.narration ?? cue.text, rate);
    }
  }, [playing, speechOn, cue, rate, speechEpoch]);

  useEffect(() => {
    if (!speechOn) cancelSpeech();
  }, [speechOn]);

  useEffect(() => () => cancelSpeech(), []);

  /* ---------- progress reporting (throttled to scene/second changes) ---------- */
  const lastReport = useRef({ s: '', sec: -1 });
  useEffect(() => {
    const sec = Math.floor(t);
    if (lastReport.current.s !== scene.id || Math.abs(lastReport.current.sec - sec) >= 3) {
      lastReport.current = { s: scene.id, sec };
      cbRef.current.onProgress?.(t, scene.id);
    }
  }, [t, scene.id]);

  /* ---------- transcript follows playback ---------- */
  useEffect(() => {
    if (!showTranscript || !cue || !transcriptRef.current) return;
    const el = transcriptRef.current.querySelector<HTMLElement>(`[data-cue="${cue.id}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [cue, showTranscript, reducedMotion]);

  /* ---------- fullscreen ---------- */
  useEffect(() => {
    const onFs = () => setFullscreen(document.fullscreenElement === shellRef.current);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  /* ---------- actions ---------- */
  const resetSpeech = () => {
    cancelSpeech();
    lastSpoken.current = null;
    setSpeechEpoch((n) => n + 1);
  };
  const play = () => {
    if (tRef.current >= duration - 0.01) setTime(0);
    resetSpeech();
    playingRef.current = true;
    setPlaying(true);
    setAnnounce('Playing');
  };
  const pause = () => {
    playingRef.current = false;
    setPlaying(false);
    setWaiting(false);
    resetSpeech();
    setAnnounce('Paused');
  };
  const toggle = () => (playingRef.current ? pause() : play());
  const seek = (to: number) => {
    resetSpeech();
    setTime(to);
  };
  const goScene = (i: number) => {
    const s = lesson.scenes[Math.max(0, Math.min(lesson.scenes.length - 1, i))];
    seek(s.start);
    setAnnounce(`Scene: ${s.title}`);
  };
  const stepCue = (dir: 1 | -1) => {
    const idx = cues.findIndex((c) => tRef.current < c.end);
    const cur = idx === -1 ? cues.length - 1 : idx;
    const target = dir === 1 ? cues[Math.min(cues.length - 1, cur + 1)] : cues[Math.max(0, tRef.current - cues[cur].start > 1 ? cur : cur - 1)];
    seek(target.start);
  };
  const replay = () => {
    seek(0);
    play();
  };
  const toggleFullscreen = async () => {
    const el = shellRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => undefined);
    } else if (el.requestFullscreen) {
      try {
        await el.requestFullscreen();
        // Prefer landscape on phones; ignored where unsupported.
        await (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> })?.lock?.('landscape').catch(() => undefined);
        return;
      } catch {
        /* fall through to CSS full-screen */
      }
      setFullscreen((f) => !f);
    } else setFullscreen((f) => !f); // iOS Safari: CSS-based full-screen
  };
  const setRate = (r: number) => {
    props.onSettingsChange?.({ rate: r });
    resetSpeech();
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') {
      if (!(tag === 'INPUT' && (e.target as HTMLInputElement).type === 'range' && (e.key === ' ' || e.key === 'k'))) return;
    }
    const k = e.key.toLowerCase();
    const handled = true;
    if (k === ' ' || k === 'k') toggle();
    else if (e.key === 'ArrowRight' && tag !== 'INPUT') seek(tRef.current + 5);
    else if (e.key === 'ArrowLeft' && tag !== 'INPUT') seek(tRef.current - 5);
    else if (k === 'l') seek(tRef.current + 10);
    else if (k === 'j') seek(tRef.current - 10);
    else if (k === 'n') goScene(sceneIndex + 1);
    else if (k === 'p') goScene(sceneIndex - 1);
    else if (k === 'm') setMuted((m) => !m);
    else if (k === 'c') props.onSettingsChange?.({ captions: !captions });
    else if (k === 'f') void toggleFullscreen();
    else if (k === 't') setShowTranscript((s) => !s);
    else return;
    if (handled) e.preventDefault();
  };

  const bookmarked = props.isSceneBookmarked?.(scene.id) ?? false;
  const atCheck = scene.kind === 'check';

  return (
    <div
      ref={shellRef}
      className={`player ${fullscreen ? 'is-fullscreen' : ''} ${reducedMotion ? 'is-reduced' : ''}`}
      onKeyDown={onKey}
      role="region"
      aria-label={`Lesson player: ${lesson.title}`}
      tabIndex={-1}
    >
      <div className="stage-badges" aria-hidden="true">
        <span className="badge">{sceneIndex + 1}/{lesson.scenes.length} · {SCENE_KIND_LABELS[scene.kind]}</span>
        <span className="stage-title">{scene.title}</span>
        <span className="spacer" />
        {waiting && <span className="badge badge-muted">Narrating…</span>}
        {reducedMotion && <span className="badge badge-muted">Reduced motion</span>}
        <span className="badge badge-muted">Schematic · not to scale</span>
      </div>
      <div className="stage-wrap">
        <Stage scene={scene} time={renderT} reducedMotion={reducedMotion} label={`${scene.title}. ${scene.altText}`} />
        {!playing && t < 0.01 && (
          <button className="big-play" onClick={play} aria-label="Play lesson">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
          </button>
        )}
        {atCheck && props.onGoToQuiz && (
          <button className="quiz-cta" onClick={() => { pause(); props.onGoToQuiz?.(); }}>Answer the 3 questions ↓</button>
        )}
      </div>

      {captions && (
        <div className={`caption caption-${captionSize}`} aria-hidden="true" data-testid="caption">
          {cue ? cue.text : ' '}
        </div>
      )}
      <div className="sr-only" aria-live="polite">{announce}</div>
      {!fullscreen && <p className="rotate-hint">For a bigger picture, turn your phone sideways or tap full screen ⤢</p>}

      <div className="controls">
        <div className="seek-row">
          <span className="time" aria-hidden="true">{formatTime(t)}</span>
          <div className="seek">
            <input
              type="range"
              min={0}
              max={duration}
              step={0.1}
              value={t}
              onChange={(e) => seek(Number(e.target.value))}
              aria-label="Seek"
              aria-valuetext={`${formatTime(t)} of ${formatTime(duration)}, ${scene.title}`}
            />
            <div className="seek-marks" aria-hidden="true">
              {lesson.scenes.map((s) => (
                <span key={s.id} style={{ left: `${(s.start / duration) * 100}%` }} title={s.title} />
              ))}
            </div>
          </div>
          <span className="time" aria-hidden="true">{formatTime(duration)}</span>
        </div>

        <div className="btn-row">
          <button className="icon-btn" onClick={() => goScene(sceneIndex - 1)} aria-label="Previous scene" title="Previous scene (P)">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6h2v12H6zM9.5 12l8.5 6V6z" fill="currentColor" /></svg>
          </button>
          <button className="icon-btn" onClick={() => stepCue(-1)} aria-label="Previous caption" title="Previous caption">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6 8.5 6V6l-8.5 6z" fill="currentColor" /></svg>
          </button>
          <button className="icon-btn primary" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'} title="Play/pause (Space)" data-testid="play-toggle">
            {playing ? (
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z" fill="currentColor" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
            )}
          </button>
          <button className="icon-btn" onClick={() => stepCue(1)} aria-label="Next caption" title="Next caption">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" fill="currentColor" /></svg>
          </button>
          <button className="icon-btn" onClick={() => goScene(sceneIndex + 1)} aria-label="Next scene" title="Next scene (N)">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 18l8.5-6L6 6v12zM16 6h2v12h-2z" fill="currentColor" /></svg>
          </button>
          <button className="icon-btn" onClick={replay} aria-label="Replay from start" title="Replay">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5V1L7 6l5 5V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z" fill="currentColor" /></svg>
          </button>

          <span className="spacer" />

          <label className="speed">
            <span className="sr-only">Playback speed</span>
            <select value={rate} onChange={(e) => setRate(Number(e.target.value))} aria-label="Playback speed">
              {SPEEDS.map((s) => (
                <option key={s} value={s}>{s}×</option>
              ))}
            </select>
          </label>
          <button
            className={`icon-btn ${captions ? 'on' : ''}`}
            onClick={() => props.onSettingsChange?.({ captions: !captions })}
            aria-pressed={captions}
            aria-label="Captions"
            title="Captions (C)"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1zm7 0h-1.5v-.5h-2v3h2V13H18v1a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1z" fill="currentColor" /></svg>
          </button>
          <button
            className={`icon-btn ${narration ? 'on' : ''}`}
            onClick={() => props.onSettingsChange?.({ narration: !narration })}
            aria-pressed={narration}
            aria-label={narrationSupported() ? 'Narration' : 'Narration (not supported in this browser)'}
            title={narrationSupported() ? 'Narration (browser speech)' : 'Narration not supported in this browser'}
            disabled={!narrationSupported()}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" fill="currentColor" /></svg>
          </button>
          <button className={`icon-btn ${muted ? 'on' : ''}`} onClick={() => setMuted((m) => !m)} aria-pressed={muted} aria-label="Mute" title="Mute (M)">
            {muted ? (
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zM19 12c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.8 8.8 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z" fill="currentColor" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05A4.47 4.47 0 0 0 16.5 12zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="currentColor" /></svg>
            )}
          </button>
          <button className={`icon-btn ${showTranscript ? 'on' : ''}`} onClick={() => setShowTranscript((s) => !s)} aria-pressed={showTranscript} aria-label="Transcript" title="Transcript (T)">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v2H4zm0 4h16v2H4zm0 4h10v2H4zm0 4h13v2H4z" fill="currentColor" /></svg>
          </button>
          {props.onToggleSceneBookmark && (
            <button
              className={`icon-btn ${bookmarked ? 'on' : ''}`}
              onClick={() => props.onToggleSceneBookmark?.(scene.id, t, scene.title)}
              aria-pressed={bookmarked}
              aria-label={bookmarked ? 'Remove scene bookmark' : 'Bookmark this scene'}
              title="Bookmark scene"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} /></svg>
            </button>
          )}
          <button className="icon-btn" onClick={() => void toggleFullscreen()} aria-pressed={fullscreen} aria-label={fullscreen ? 'Exit full screen' : 'Full screen'} title="Full screen (F)">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d={fullscreen ? 'M5 16h3v3h2v-5H5zm3-8H5v2h5V5H8zm6 11h2v-3h3v-2h-5zm2-11V5h-2v5h5V8z' : 'M7 14H5v5h5v-2H7zm-2-4h2V7h3V5H5zm12 7h-3v2h5v-5h-2zM14 5v2h3v3h2V5z'} fill="currentColor" /></svg>
          </button>
        </div>

        <nav className="scene-nav" aria-label="Scenes">
          {lesson.scenes.map((s, i) => {
            const prog = t >= s.end ? 1 : t <= s.start ? 0 : (t - s.start) / (s.end - s.start);
            return (
              <button key={s.id} className={`scene-chip ${i === sceneIndex ? 'active' : ''}`} onClick={() => goScene(i)} aria-current={i === sceneIndex ? 'step' : undefined}>
                <span className="scene-chip-fill" style={{ width: `${prog * 100}%` }} aria-hidden="true" />
                <span className="scene-chip-n">{i + 1}</span>
                <span className="scene-chip-t">{SCENE_KIND_LABELS[s.kind]}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {showTranscript && (
        <div className="transcript" aria-label="Transcript" role="region" tabIndex={0}>
          <h3>Transcript</h3>
          <ol ref={transcriptRef}>
            {lesson.scenes.map((s) => (
              <li key={s.id} className="transcript-scene">
                <strong>{SCENE_KIND_LABELS[s.kind]} — {s.title}</strong>
                <ol>
                  {s.cues.map((c) => (
                    <li key={c.id} data-cue={c.id} className={cue?.id === c.id ? 'current' : ''}>
                      <button onClick={() => seek(c.start)} aria-label={`Jump to ${formatTime(c.start)}`}>{formatTime(c.start)}</button>
                      <span>{c.text}</span>
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
