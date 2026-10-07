/**
 * Optional narration using the browser's built-in Web Speech API.
 * No network service or API key is required; if the browser has no speech
 * synthesis, narration is simply unavailable and captions carry the lesson.
 */

let speaking = false;
let safetyTimer: ReturnType<typeof setTimeout> | null = null;
let token = 0;

export function narrationSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';
}

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => /en[-_](US|GB|PH|AU)/i.test(v.lang) && /natural|neural|google|samantha|daniel/i.test(v.name)) ??
    voices.find((v) => /^en/i.test(v.lang)) ??
    null
  );
}

/** Speaks text; resolves `onDone` when finished, cancelled, or after a safety timeout. */
export function speak(text: string, rate: number, onDone?: () => void): void {
  if (!narrationSupported()) return;
  cancelSpeech();
  const my = ++token;
  const u = new SpeechSynthesisUtterance(text);
  u.rate = Math.min(2, Math.max(0.5, rate));
  u.lang = 'en-US';
  const v = pickVoice();
  if (v) u.voice = v;
  const finish = () => {
    if (my !== token) return;
    speaking = false;
    if (safetyTimer) clearTimeout(safetyTimer);
    safetyTimer = null;
    onDone?.();
  };
  u.onend = finish;
  u.onerror = finish;
  speaking = true;
  // Some engines never fire onend; never let the lesson hang waiting for it.
  const words = text.split(/\s+/).length;
  safetyTimer = setTimeout(finish, ((words / 2.6) / u.rate + 4) * 1000);
  window.speechSynthesis.speak(u);
}

export function cancelSpeech(): void {
  token++;
  speaking = false;
  if (safetyTimer) clearTimeout(safetyTimer);
  safetyTimer = null;
  if (narrationSupported()) window.speechSynthesis.cancel();
}

export function isSpeaking(): boolean {
  return speaking;
}
