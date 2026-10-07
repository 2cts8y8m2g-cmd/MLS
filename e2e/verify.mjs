/**
 * End-to-end verification in a real browser (Chromium via playwright-core).
 * Builds nothing itself: run `npm run build` first. Starts `vite preview`,
 * exercises the app, prints a PASS/FAIL line per check, saves screenshots to
 * e2e/artifacts/, and exits non-zero if any check fails.
 *
 *   npm run build && npm run e2e
 *   CHROMIUM_PATH=/path/to/chrome npm run e2e   # if Chromium is elsewhere
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';
import { readdirSync, readFileSync } from 'node:fs';

const LESSON_DIR = new URL('../content/lessons/', import.meta.url).pathname;
const LESSON_FILES = readdirSync(LESSON_DIR).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(LESSON_DIR + f, 'utf8')));

const PORT = 4179;
const BASE = `http://localhost:${PORT}/`;
const OUT = new URL('./artifacts/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const CANDIDATES = [process.env.CHROMIUM_PATH, '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium/chrome-linux/chrome'].filter(Boolean);
const executablePath = CANDIDATES.find((p) => existsSync(p));

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const viteBin = new URL('../node_modules/vite/bin/vite.js', import.meta.url).pathname;
const server = spawn(process.execPath, [viteBin, 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'pipe', detached: true });
const stopServer = () => { try { process.kill(-server.pid); } catch { /* already stopped */ } };
process.on('exit', stopServer);
await new Promise((res, rej) => {
  const t = setTimeout(() => rej(new Error('preview server did not start')), 15000);
  server.stdout.on('data', (d) => d.toString().includes(String(PORT)) && (clearTimeout(t), res()));
  server.stderr.on('data', (d) => process.stderr.write(d));
});

const browser = await chromium.launch({ executablePath, args: ['--autoplay-policy=no-user-gesture-required'] });

/** Fake speech engine so narration sync can be verified deterministically. */
const speechStub = () => {
  window.__spoken = [];
  window.__speechEndsAfterMs = 400;
  window.SpeechSynthesisUtterance = function (text) { this.text = text; };
  const synth = {
    speaking: false,
    getVoices: () => [],
    speak(u) {
      window.__spoken.push(u.text);
      if (window.__speechEndsAfterMs >= 0) setTimeout(() => u.onend && u.onend(), window.__speechEndsAfterMs);
    },
    cancel() {},
  };
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
};

async function newPage(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, ...opts });
  await ctx.addInitScript(speechStub);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  return { ctx, page, errors };
}

const seekValue = (page) => page.$eval('input[aria-label="Seek"]', (el) => Number(el.value));
const setSeek = (page, v) =>
  page.$eval('input[aria-label="Seek"]', (el, val) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(el, String(val));
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, v);
const caption = (page) => page.$eval('[data-testid="caption"]', (el) => el.textContent.trim()).catch(() => null);
const stageHtml = (page) => page.$eval('.stage-svg', (el) => el.innerHTML);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const LESSON = `${BASE}#/lesson/ih-abo-forward-reverse`;

try {
  /* ---------------- desktop: dashboard ---------------- */
  {
    const { ctx, page, errors } = await newPage();
    await page.goto(BASE);
    await page.waitForSelector('h1');
    check('Dashboard renders', (await page.textContent('h1')).includes('Watch it happen'));
    const recs = await page.textContent('#recs');
    check('Dashboard recommends lessons in reviewer order (Ch. 1 first)', recs.indexOf("CLIA '88") > -1 && (recs.indexOf('ABO Forward') === -1 || recs.indexOf("CLIA '88") < recs.indexOf('ABO Forward')));
    check('Dashboard names the source reviewer', (await page.textContent('main')).includes('Source: MEMORY LAB'));
    await page.screenshot({ path: `${OUT}dashboard-desktop.png`, fullPage: true });

    // track selection persists
    await page.click('label.track-card:has-text("PH MTLE")');
    check('Track selection updates blueprint', (await page.textContent('main')).includes('PH MTLE blueprint'));
    await page.reload();
    check('Track selection persists across reload', (await page.$eval('select[aria-label="Exam track"]', (e) => e.value)) === 'mtle');
    await page.click('label.track-card:has-text("Both tracks")');

    // curriculum search
    await page.goto(`${BASE}#/curriculum`);
    await page.fill('input[type=search]', 'Bombay');
    const found = await page.textContent('main');
    check('Curriculum search finds reviewer concepts with locators', found.includes('Bombay (Oh)') && found.includes('Ch. 40 · High-Yield Hits #13'));
    await page.fill('input[type=search]', 'deemed status');
    check('Curriculum search covers lesson captions', (await page.textContent('main')).includes('CLIA'));
    await page.fill('input[type=search]', 'zzzzqqq');
    check('Curriculum search handles no results', (await page.textContent('main')).includes('No concepts match'));
    check('No console errors on dashboard/curriculum', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  /* ---------------- desktop: player ---------------- */
  {
    const { ctx, page, errors } = await newPage();
    await page.goto(LESSON);
    await page.waitForSelector('.stage-svg');
    await page.screenshot({ path: `${OUT}lesson-start.png` });
    check('Player starts at 0:00', (await seekValue(page)) === 0);
    check('Scene list has 8 teaching beats', (await page.$$('.scene-chip')).length === 8);

    await page.click('[data-testid="play-toggle"]');
    await wait(1500);
    const t1 = await seekValue(page);
    check('Play advances the clock', t1 > 1 && t1 < 2.5, `t=${t1.toFixed(2)}`);
    check('Caption synchronized with time', (await caption(page)).startsWith('A patient needs a transfusion'));
    await page.click('[data-testid="play-toggle"]');
    const p1 = await seekValue(page);
    await wait(700);
    check('Pause stops the clock', Math.abs((await seekValue(page)) - p1) < 0.05);

    // speed
    await page.selectOption('select[aria-label="Playback speed"]', '2');
    const s0 = await seekValue(page);
    await page.click('[data-testid="play-toggle"]');
    await wait(1000);
    await page.click('[data-testid="play-toggle"]');
    const ds = (await seekValue(page)) - s0;
    check('2× speed doubles the rate', ds > 1.6 && ds < 2.5, `Δ=${ds.toFixed(2)} s in ~1 s`);
    await page.selectOption('select[aria-label="Playback speed"]', '1');

    // seeking
    await setSeek(page, 70);
    await wait(100);
    check('Seeking moves captions', (await caption(page)).startsWith('Example one: a two-month-old'));
    check('Seeking moves the scene', (await page.textContent('.scene-chip.active')).includes('What changes'));

    // animation actually changes the picture over time (lattice forms)
    await setSeek(page, 20 + 14.6);
    await wait(80);
    const before = await stageHtml(page);
    await setSeek(page, 20 + 19.8);
    await wait(80);
    const after = await stageHtml(page);
    check('Agglutination animation changes the stage between keyframes', before !== after);
    await page.screenshot({ path: `${OUT}lesson-lattice.png` });
    // the clumped lattice: cells closer together at the end
    const spread = await page.$$eval('[data-id="normal-lattice"] g.cell', (gs) => {
      const pts = gs.map((g) => g.getAttribute('transform').match(/translate\(([-\d.]+),([-\d.]+)\)/)).filter(Boolean).map((m) => [Number(m[1]), Number(m[2])]);
      const xs = pts.map((p) => p[0]);
      return Math.max(...xs) - Math.min(...xs);
    });
    check('Cells cluster into a lattice when agglutinated', spread > 0 && spread < 220, `x-spread ${spread.toFixed(0)}px`);

    // scene navigation
    await page.click('.scene-chip:has-text("Laboratory connection")');
    check('Scene navigation jumps to scene start', Math.abs((await seekValue(page)) - 100) < 0.01);
    check('Scene caption shown after jump', (await caption(page)).startsWith('At the bench'));
    await page.keyboard.press('n');
    check('Keyboard N jumps to next scene', Math.abs((await seekValue(page)) - 138) < 0.01);
    await setSeek(page, 130);
    await wait(80);
    await page.screenshot({ path: `${OUT}lesson-bench.png` });
    const results = await page.$$eval('[data-id^="lab-t"] text', (ts) => ts.map((t) => t.textContent));
    check('Tube grades appear in the lab scene', results.includes('4+') && results.includes('0'), results.filter((r) => /\d/.test(r)).join(','));

    // captions toggle
    await page.click('button[aria-label="Captions"]');
    check('Captions can be hidden', (await page.$('[data-testid="caption"]')) === null);
    await page.click('button[aria-label="Captions"]');
    check('Captions can be shown again', (await page.$('[data-testid="caption"]')) !== null);

    // transcript
    await page.click('button[aria-label="Transcript"]');
    const tItems = await page.$$('.transcript li li');
    check('Full transcript lists every cue', tItems.length >= 28, `${tItems.length} cues`);
    await page.click('.transcript li li:has-text("Memory aid: Flags Forward") button');
    check('Transcript click seeks', Math.abs((await seekValue(page)) - 166) < 0.01);
    check('Current transcript line highlighted', (await page.textContent('.transcript li li.current')).includes('Memory aid'));

    // replay + end-of-lesson
    await setSeek(page, 209.5);
    await page.click('[data-testid="play-toggle"]');
    await wait(900);
    check('Playback stops at the end', (await seekValue(page)) === 210 && (await page.getAttribute('[data-testid="play-toggle"]', 'aria-label')) === 'Play');
    await page.click('button[aria-label="Replay from start"]');
    await wait(400);
    const rv = await seekValue(page);
    check('Replay restarts from the beginning and plays', rv > 0 && rv < 1.5);
    await page.click('[data-testid="play-toggle"]');

    // fullscreen
    await page.click('button[aria-label="Full screen"]');
    await wait(300);
    const fs = await page.evaluate(() => !!document.fullscreenElement || !!document.querySelector('.player.is-fullscreen'));
    check('Full-screen mode engages', fs);
    await page.screenshot({ path: `${OUT}lesson-fullscreen.png` });
    await page.click('button[aria-label="Exit full screen"]').catch(() => page.keyboard.press('Escape'));
    await wait(200);

    // narration sync with stubbed speech engine
    await page.click('button[aria-label="Narration"]');
    await setSeek(page, 0);
    await page.evaluate(() => { window.__spoken = []; window.__speechEndsAfterMs = -1; }); // speech never ends
    await page.click('[data-testid="play-toggle"]');
    await wait(400);
    const spoken = await page.evaluate(() => window.__spoken.slice());
    check('Narration speaks the active caption', spoken[0]?.startsWith('A patient needs a transfusion'), spoken[0]);
    await setSeek(page, 6.0); // h1 ends at 6.5; speech for h1 "never ends"
    await page.evaluate(() => { window.__spoken = []; });
    await wait(200);
    // seek resets speech; the current cue is re-spoken; then the clock must hold before 6.5
    await wait(1500);
    const held = await seekValue(page);
    const heldCaption = await caption(page);
    check('Clock holds at caption end while narration is still speaking', held <= 6.5 && held > 6.3 && heldCaption.startsWith('A patient needs'), `t≈${held.toFixed(2)}, caption still cue 1`);
    check('Player shows "Narrating…" while holding', (await page.textContent('.stage-badges')).includes('Narrating'));
    await page.evaluate(() => { window.__speechEndsAfterMs = 50; });
    await page.click('button[aria-label="Mute"]');
    await wait(600);
    check('Mute releases the hold and playback continues', (await seekValue(page)) > 6.5);
    await page.click('[data-testid="play-toggle"]');
    await page.click('button[aria-label="Mute"]');
    await page.click('button[aria-label="Narration"]');

    // quiz scoring
    const q = (id) => `[data-testid="question-${id}"]`;
    await page.check(`${q('ih-abo-fr-q1')} input[value="a"]`);
    await page.click(`${q('ih-abo-fr-q1')} button:has-text("Check answer")`);
    await page.check(`${q('ih-abo-fr-q2')} input[value="d"]`);
    await page.click(`${q('ih-abo-fr-q2')} button:has-text("Check answer")`);
    await page.check(`${q('ih-abo-fr-q3')} input[value="a"]`);
    await page.click(`${q('ih-abo-fr-q3')} button:has-text("Check answer")`);
    const score = await page.textContent('[data-testid="quiz-score"]');
    check('Quiz scores 2 of 3', score.includes('2 / 3') && score.includes('67%'), score);
    const rationales = await page.$$(`${q('ih-abo-fr-q2')} .rationale`);
    check('Every option shows its rationale after checking', rationales.length === 4);
    check('Wrong answer explained', (await page.textContent(`${q('ih-abo-fr-q2')} .opt-wrong`)).includes('Rouleaux'));
    await page.screenshot({ path: `${OUT}quiz.png`, fullPage: false, clip: await page.$eval(q('ih-abo-fr-q2'), (el) => { el.scrollIntoView(); const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: Math.min(r.height, 900) }; }) });

    // bookmarks + saved position
    await page.click('button:has-text("Bookmark lesson")');
    await page.click('.scene-chip:has-text("Exam distinction")');
    await page.click('button[aria-label="Bookmark this scene"]');
    await setSeek(page, 150);
    await wait(700); // progress debounce
    await page.reload();
    await page.waitForSelector('.stage-svg');
    const resumed = await seekValue(page);
    check('Saved position restored after reload', Math.abs(resumed - 150) < 3.5, `t=${resumed}`);
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('memorylab:v1')));
    check('Quiz attempts persisted', stored.attempts.length === 3 && stored.attempts.filter((a) => a.correct).length === 2);
    check('Bookmarks persisted (lesson + scene)', stored.bookmarks.length === 2);

    await page.goto(`${BASE}#/review`);
    await page.waitForSelector('h1');
    const review = await page.textContent('main');
    check('Weak-area review reflects the missed skill', review.includes('Explain causes of ABO discrepancies') && review.includes('Retry missed questions (1)'));
    await page.click('button:has-text("Retry missed questions")');
    check('Retry shows only the missed question', (await page.$$('.quiz .question')).length === 1);
    await page.screenshot({ path: `${OUT}review.png`, fullPage: true });

    await page.goto(BASE);
    await page.waitForSelector('#recs');
    check('Dashboard recommends weak-area review', (await page.textContent('#recs')).includes('Review:'));
    check('Dashboard lists bookmarks', (await page.textContent('#bookmarks')).includes('Look-alikes the exam loves'));

    // coverage page honesty
    await page.goto(`${BASE}#/coverage`);
    await page.waitForSelector('h1');
    const cov = await page.textContent('main');
    const taughtN = new Set(LESSON_FILES.flatMap((l) => l.conceptIds)).size;
    check(`Coverage counts ${taughtN} taught concepts, all requiring review`, new RegExp(`Complete lessons\\s*${taughtN}(?!\\d)`).test(cov) && new RegExp(`requiring review\\s*${taughtN}(?!\\d)`).test(cov));
    check('Coverage flags unverified ASCP outline', cov.includes('unverified'));
    check('Coverage lists all 79 reviewer chapters', (await page.$$('#chapters tbody tr')).length === 79);
    check('Coverage shows the reviewer accuracy register', cov.includes('Reviewer accuracy register') && cov.includes('48 systems'));
    await page.screenshot({ path: `${OUT}coverage.png`, fullPage: true });

    // authoring
    await page.goto(`${BASE}#/author`);
    await page.waitForSelector('#lesson-json');
    await wait(600);
    check('Author: loaded lesson validates as complete', (await page.textContent('.author-status')).includes('Complete — counts toward coverage'));
    check('Author: live preview renders the player', (await page.$('.author-preview .stage-svg')) !== null);
    await page.selectOption('select[aria-label="Load a lesson into the editor"]', '__template');
    await wait(700);
    check('Author: template is a playable draft, not complete', (await page.textContent('.author-status')).includes('Playable draft — not yet complete'));
    await page.fill('#lesson-json', '{ broken');
    await wait(700);
    check('Author: JSON errors are reported', (await page.textContent('.author-status')).includes('JSON error'));
    check('No console errors during player/quiz/author flows', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  /* ---------------- second lesson (new visual types) ---------------- */
  {
    const { ctx, page, errors } = await newPage();
    await page.goto(`${BASE}#/lesson/ops-clia-complexity-accreditation`);
    await page.waitForSelector('.stage-svg');
    await setSeek(page, 20 + 25);
    await wait(100);
    const types = await page.$$eval('.stage-svg [data-visual]', (els) => [...new Set(els.map((e) => e.getAttribute('data-visual')))]);
    check('CLIA lesson renders the new visual types', ['bin', 'token'].every((t) => types.includes(t)), types.join(','));
    await page.screenshot({ path: `${OUT}clia-bins.png` });
    await setSeek(page, 62 + 25);
    await wait(100);
    check('CLIA lesson caption synchronized in “What changes”', (await caption(page)).startsWith('CMS approves an accreditor'));
    check('Lesson shows its reviewer location', (await page.textContent('main')).includes('Ch. 1 · High-Yield Hits #1, #2, #3, #4'));
    check('No console errors on the CLIA lesson', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  /* ---------------- reduced motion ---------------- */
  {
    const { ctx, page } = await newPage({ reducedMotion: 'reduce' });
    await page.goto(LESSON);
    await page.waitForSelector('.stage-svg');
    check('Reduced motion detected from OS setting', (await page.textContent('.stage-badges')).includes('Reduced motion'));
    await setSeek(page, 20 + 14.2);
    await wait(80);
    const a = await stageHtml(page);
    await setSeek(page, 20 + 19.8);
    await wait(80);
    const b = await stageHtml(page);
    check('Reduced motion: no tweening within a caption (frame is static)', a === b);
    await setSeek(page, 20 + 20.5);
    await wait(80);
    check('Reduced motion: visuals still step with captions', (await stageHtml(page)) !== b);
    await ctx.close();
  }

  /* ---------------- practice (imported reviewer question bank) ---------------- */
  {
    const { ctx, page, errors } = await newPage();
    await page.goto(BASE + '#/practice');
    await page.waitForSelector('[data-testid="bank-provenance"]');
    const prov = await page.textContent('[data-testid="bank-provenance"]');
    check('Practice: provenance states permission and unverified status', prov.includes('hold the rights') && prov.includes('not been verified'), prov.slice(0, 120));
    check('Practice: whole bank available by default', (await page.textContent('[data-testid="bank-available"]')).startsWith('828 '));
    await page.selectOption('[data-testid="bank-domain"]', 'p5-bb');
    const bbCount = parseInt(await page.textContent('[data-testid="bank-available"]'), 10);
    check('Practice: filtering by area narrows the pool', bbCount > 0 && bbCount < 828, String(bbCount));
    await page.click('[data-testid="bank-start"]');
    await page.waitForSelector('[data-testid^="bank-question-"]');
    await page.click('[data-testid^="bank-question-"] label.option >> nth=0');
    await page.click('[data-testid="bank-check"]');
    await page.waitForSelector('.bank-feedback');
    check('Practice: feedback shows the reviewer’s explanation and source', (await page.textContent('.bank-feedback')).includes('Reviewer’s explanation') && (await page.textContent('.bank-feedback')).includes('not verified by this app'));
    await page.click('button:has-text("End set")');
    await page.waitForSelector('[data-testid="bank-score"]');
    check('Practice: results count the answered question', /of 1\b/.test(await page.textContent('[data-testid="bank-score"]')));
    await page.click('[data-testid="bank-again"]');
    await page.waitForSelector('#bank-progress');
    check('Practice: progress table records the answer', (await page.textContent('#bank-progress')).includes('1 / '));
    await page.selectOption('[data-testid="bank-domain"]', 'p2-chem');
    await page.click('input[name="mode"] >> nth=1');
    await page.selectOption('select >> nth=4', '10');
    await page.click('[data-testid="bank-start"]');
    await page.waitForSelector('[data-testid="bank-timer"]');
    check('Practice (exam): pacing timer shown', (await page.textContent('[data-testid="bank-timer"]')).includes('of 15 min pace'));
    check('Practice (exam): no feedback before the end', (await page.$('.bank-feedback')) === null);
    await page.click('[data-testid^="bank-question-"] label.option >> nth=1');
    for (let i = 0; i < 10; i++) await page.click('[data-testid="bank-next"]');
    await page.waitForSelector('[data-testid="bank-score"]');
    check('Practice (exam): results review all 10 answers', (await page.$$('.bank-feedback')).length === 10 && /of 10\b/.test(await page.textContent('[data-testid="bank-score"]')));
    await page.goto(BASE);
    await page.waitForSelector('h1');
    check('Practice: dashboard counts bank answers', (await page.textContent('#progress')).includes('Questions answered2'));
    await page.goto(BASE + '#/practice');
    await page.waitForSelector('[data-testid="bank-provenance"]');
    await page.screenshot({ path: `${OUT}practice.png`, fullPage: true });
    check('No console errors on practice', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  /* ---------------- mobile ---------------- */
  {
    const { ctx, page, errors } = await newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    for (const route of ['', '#/curriculum', '#/lesson/ih-abo-forward-reverse', '#/practice', '#/review', '#/coverage', '#/settings', '#/author']) {
      await page.goto(BASE + route);
      await page.waitForSelector('h1');
      await wait(300);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      check(`Mobile: no horizontal scroll on ${route || 'dashboard'}`, overflow <= 1, `overflow ${overflow}px`);
    }
    await page.goto(LESSON);
    await page.waitForSelector('.stage-svg');
    check('Mobile: bottom navigation visible', await page.isVisible('.bottomnav'));
    const btn = await page.$eval('[data-testid="play-toggle"]', (el) => el.getBoundingClientRect());
    check('Mobile: touch targets ≥ 40 px', btn.width >= 40 && btn.height >= 40, `${btn.width}×${btn.height}`);
    await setSeek(page, 92);
    await wait(100);
    await page.screenshot({ path: `${OUT}mobile-lesson.png` });
    await page.goto(BASE);
    await page.waitForSelector('h1');
    await page.screenshot({ path: `${OUT}mobile-dashboard.png`, fullPage: true });
    await page.goto(LESSON);
    await page.waitForSelector('.stage-svg');
    await page.click('button[aria-label="Full screen"]');
    await wait(300);
    await page.screenshot({ path: `${OUT}mobile-fullscreen.png` });
    check('No console errors on mobile', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  /* ---------------- dark theme + accessibility ---------------- */
  for (const scheme of ['light', 'dark']) {
    const { ctx, page } = await newPage({ colorScheme: scheme });
    for (const route of ['', '#/curriculum', '#/lesson/ih-abo-forward-reverse', '#/practice', '#/review', '#/coverage', '#/settings', '#/author']) {
      await page.goto(BASE + route);
      await page.waitForSelector('h1');
      await wait(500);
      if (route.includes('lesson')) {
        await page.click('button[aria-label="Transcript"]');
        if (scheme === 'dark') {
          await setSeek(page, 150);
          await wait(80);
          await page.screenshot({ path: `${OUT}lesson-dark.png` });
        }
      }
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const serious = axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      check(`a11y (${scheme}) ${route || 'dashboard'}: no serious/critical axe violations`, serious.length === 0,
        serious.map((v) => `${v.id}(${v.nodes.length}): ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join('; ')}`).join(' | '));
    }
    await ctx.close();
  }
} catch (e) {
  check('Unexpected error', false, e.stack);
} finally {
  await browser.close();
  stopServer();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed. Screenshots: e2e/artifacts/`);
process.exit(failed.length ? 1 : 0);
