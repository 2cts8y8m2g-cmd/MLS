import {
  SCENE_KINDS,
  SCENE_KIND_LABELS,
  VISUAL_TYPES,
  type Curriculum,
  type Lesson,
} from './types';

export interface CheckItem {
  id: string;
  label: string;
  ok: boolean;
  detail?: string;
}

export interface ValidationResult {
  /** Structural problems: the lesson cannot be played reliably. */
  errors: string[];
  /** Completeness checklist: all must pass for the lesson to count as completed. */
  checklist: CheckItem[];
  /** True only when there are no errors and every checklist item passes. */
  complete: boolean;
}

const isStr = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const EPS = 1e-6;

/** Counts sentences so a "one sentence" takeaway can be enforced. */
export function sentenceCount(text: string): number {
  // Ignore common abbreviations and decimals before splitting.
  const cleaned = text
    .replace(/\b(e\.g|i\.e|vs|etc|approx|Dr|St)\./gi, '$1')
    .replace(/(\d)\.(\d)/g, '$1$2');
  return cleaned.split(/[.!?]+(?:\s|$)/).filter((s) => s.trim().length > 0).length;
}

/**
 * Validates a lesson object (possibly untrusted JSON from the authoring page).
 * Never throws: every problem is returned as a message.
 */
export function validateLesson(input: unknown, knownConceptIds?: Set<string>): ValidationResult {
  const errors: string[] = [];
  const checklist: CheckItem[] = [];
  const add = (id: string, label: string, ok: boolean, detail?: string) =>
    checklist.push({ id, label, ok, detail });

  if (typeof input !== 'object' || input === null) {
    return { errors: ['Lesson must be a JSON object.'], checklist, complete: false };
  }
  const l = input as Partial<Lesson>;

  // ---------- identity ----------
  if (l.schemaVersion !== 1) errors.push('schemaVersion must be 1.');
  if (!isStr(l.id) || !/^[a-z0-9][a-z0-9-]*$/.test(l.id)) errors.push('id must be lowercase letters, digits and hyphens.');
  if (!isStr(l.title)) errors.push('title is required.');
  if (!isStr(l.summary)) errors.push('summary is required.');
  if (!isStr(l.domain)) errors.push('domain is required.');
  if (!isStr(l.topic)) errors.push('topic is required.');
  if (!Array.isArray(l.tracks) || l.tracks.length === 0 || l.tracks.some((t) => t !== 'ascp' && t !== 'mtle'))
    errors.push('tracks must list "ascp" and/or "mtle".');
  if (!Array.isArray(l.conceptIds)) errors.push('conceptIds must be an array.');
  else if (knownConceptIds) {
    for (const c of l.conceptIds) if (!knownConceptIds.has(c)) errors.push(`conceptIds: "${c}" is not in the curriculum.`);
  }
  if (!Array.isArray(l.prerequisites)) errors.push('prerequisites must be an array (may be empty).');
  else if (knownConceptIds) {
    for (const c of l.prerequisites) if (!knownConceptIds.has(c)) errors.push(`prerequisites: "${c}" is not in the curriculum.`);
  }
  if (!l.reviewer || !['mapped', 'unmapped-reviewer-unavailable', 'not-in-reviewer'].includes(l.reviewer.status))
    errors.push('reviewer.status is required.');
  else if (!Array.isArray(l.reviewer.locations)) errors.push('reviewer.locations must be an array.');
  else if (l.reviewer.locations.some((x) => !isNum(x?.chapter) || !isStr(x?.section)))
    errors.push('reviewer.locations entries need a numeric chapter and a section.');
  if (!isStr(l.revisedAt) || !/^\d{4}-\d{2}-\d{2}$/.test(l.revisedAt)) errors.push('revisedAt must be YYYY-MM-DD.');

  // ---------- scenes & timing ----------
  const scenes = Array.isArray(l.scenes) ? l.scenes : [];
  if (!Array.isArray(l.scenes)) errors.push('scenes must be an array.');
  if (!isNum(l.duration) || l.duration <= 0) errors.push('duration must be a positive number of seconds.');

  const kinds = scenes.map((s) => s?.kind);
  const kindsInOrder =
    kinds.length === SCENE_KINDS.length && SCENE_KINDS.every((k, i) => kinds[i] === k);
  add(
    'scene-order',
    'All eight teaching beats present, in order',
    kindsInOrder,
    kindsInOrder ? undefined : `Expected ${SCENE_KINDS.join(' → ')}; found ${kinds.join(' → ') || 'none'}.`,
  );

  const sceneIds = new Set<string>();
  let prevEnd = 0;
  scenes.forEach((s, i) => {
    const where = `scenes[${i}]${s && isStr(s.id) ? ` (${s.id})` : ''}`;
    if (!s || typeof s !== 'object') {
      errors.push(`${where} must be an object.`);
      return;
    }
    if (!isStr(s.id)) errors.push(`${where}: id is required.`);
    else if (sceneIds.has(s.id)) errors.push(`${where}: duplicate scene id.`);
    else sceneIds.add(s.id);
    if (!isStr(s.title)) errors.push(`${where}: title is required.`);
    if (!isNum(s.start) || !isNum(s.end) || s.end <= s.start) errors.push(`${where}: start/end invalid.`);
    else {
      if (Math.abs(s.start - prevEnd) > EPS) errors.push(`${where}: starts at ${s.start}s but previous scene ends at ${prevEnd}s (scenes must be contiguous).`);
      prevEnd = s.end;
    }
    // cues
    const cues = Array.isArray(s.cues) ? s.cues : [];
    let prevCueEnd = s.start;
    cues.forEach((c, j) => {
      const cw = `${where} cue ${j}`;
      if (!isStr(c?.id)) errors.push(`${cw}: id is required.`);
      if (!isStr(c?.text)) errors.push(`${cw}: text is required.`);
      if (!isNum(c?.start) || !isNum(c?.end) || c.end <= c.start) errors.push(`${cw}: start/end invalid.`);
      else {
        if (c.start < s.start - EPS || c.end > s.end + EPS) errors.push(`${cw}: must lie within the scene (${s.start}–${s.end}s).`);
        if (c.start < prevCueEnd - EPS) errors.push(`${cw}: overlaps the previous cue.`);
        prevCueEnd = c.end;
      }
    });
    // objects
    const objects = Array.isArray(s.objects) ? s.objects : [];
    const ids = new Set<string>();
    objects.forEach((o, j) => {
      const ow = `${where} object ${j}${o && isStr(o.id) ? ` (${o.id})` : ''}`;
      if (!isStr(o?.id)) errors.push(`${ow}: id is required.`);
      else if (ids.has(o.id)) errors.push(`${ow}: duplicate object id in scene.`);
      else ids.add(o.id);
      if (!VISUAL_TYPES.includes(o?.type as never)) errors.push(`${ow}: unknown visual type "${String(o?.type)}".`);
      if (!o?.props || typeof o.props !== 'object') errors.push(`${ow}: props object is required.`);
      if (o?.keys !== undefined) {
        if (!Array.isArray(o.keys)) errors.push(`${ow}: keys must be an array.`);
        else {
          let pt = -Infinity;
          const len = isNum(s.end) && isNum(s.start) ? s.end - s.start : Infinity;
          o.keys.forEach((k, m) => {
            if (!isNum(k?.t)) errors.push(`${ow} key ${m}: t must be a number.`);
            else {
              if (k.t < pt) errors.push(`${ow} key ${m}: keyframes must be sorted by t.`);
              if (k.t < 0 || k.t > len + EPS) errors.push(`${ow} key ${m}: t=${k.t} is outside the scene (0–${len}s, relative).`);
              pt = k.t;
            }
          });
        }
      }
    });

    const label = SCENE_KIND_LABELS[s.kind as keyof typeof SCENE_KIND_LABELS] ?? s.kind;
    const animated = objects.some((o) => Array.isArray(o.keys) && o.keys.length >= 2);
    add(`scene-${i}-content`, `${label}: captions, visuals and animation`, cues.length > 0 && objects.length > 0 && animated && isStr(s.altText),
      [
        cues.length === 0 && 'no captions',
        objects.length === 0 && 'no visual objects',
        objects.length > 0 && !animated && 'no animated object (needs ≥2 keyframes)',
        !isStr(s.altText) && 'missing altText',
      ].filter(Boolean).join(', ') || undefined);
  });
  if (scenes.length > 0 && isNum(l.duration) && Math.abs(prevEnd - l.duration) > EPS)
    errors.push(`duration (${l.duration}s) must equal the last scene end (${prevEnd}s).`);
  if (scenes.length > 0 && isNum(scenes[0]?.start) && scenes[0].start !== 0) errors.push('The first scene must start at 0.');

  // ---------- teaching content ----------
  const ex = l.explanation;
  const exOk = !!ex && (['what', 'why', 'measure', 'differs', 'examAngle'] as const).every((k) => isStr(ex[k]) && ex[k].length >= 40);
  add('explanation', 'Five-question explanation (what, why, measure, differs, exam angle)', exOk);
  add('reviewer-map', 'Mapped to reviewer chapter/section (or marked not-in-reviewer)',
    !!l.reviewer && (l.reviewer.status === 'not-in-reviewer' ? isStr(l.reviewer.note) : l.reviewer.status === 'mapped' && Array.isArray(l.reviewer.locations) && l.reviewer.locations.length > 0));
  add('concepts', 'Mapped to at least one curriculum concept', Array.isArray(l.conceptIds) && l.conceptIds.length > 0);
  add('objectives', 'Learning objectives', Array.isArray(l.objectives) && l.objectives.length > 0 && l.objectives.every(isStr));

  const comps = Array.isArray(l.comparisons) ? l.comparisons : [];
  add('comparisons', 'Side-by-side comparison with a distinguishing feature',
    comps.length > 0 && comps.every((c) => isStr(c?.title) && isStr(c?.distinguisher) && c.left?.points?.length >= 2 && c.right?.points?.length >= 2));

  const mn = l.mnemonic;
  add('mnemonic', 'Original mnemonic with explanation and stated limitation', !!mn && isStr(mn.text) && isStr(mn.explanation) && isStr(mn.limitation));
  add('analogy-limits', 'Analogy limitations listed', Array.isArray(l.analogyLimitations) && l.analogyLimitations.length > 0 && l.analogyLimitations.every(isStr));
  add('takeaway', 'One-sentence takeaway', isStr(l.takeaway) && sentenceCount(l.takeaway) === 1,
    isStr(l.takeaway) ? `${sentenceCount(l.takeaway)} sentence(s)` : 'missing');

  // ---------- questions ----------
  const qs = Array.isArray(l.questions) ? l.questions : [];
  const qIds = new Set<string>();
  const qProblems: string[] = [];
  qs.forEach((q, i) => {
    const qw = `question ${i + 1}`;
    if (!isStr(q?.id)) errors.push(`${qw}: id is required.`);
    else if (qIds.has(q.id)) errors.push(`${qw}: duplicate id "${q.id}".`);
    else qIds.add(q.id);
    if (!isStr(q?.stem)) qProblems.push(`${qw}: stem missing`);
    if (!isStr(q?.skill)) qProblems.push(`${qw}: skill tag missing`);
    const opts = Array.isArray(q?.options) ? q.options : [];
    if (opts.length < 3) qProblems.push(`${qw}: needs ≥3 options`);
    const optIds = new Set(opts.map((o) => o?.id));
    if (optIds.size !== opts.length) errors.push(`${qw}: duplicate option ids.`);
    if (!optIds.has(q?.answer)) errors.push(`${qw}: answer "${String(q?.answer)}" is not one of the options.`);
    opts.forEach((o) => {
      if (!isStr(o?.text)) qProblems.push(`${qw}: option text missing`);
      if (!isStr(o?.rationale) || o.rationale.length < 20) qProblems.push(`${qw}: option ${String(o?.id)} lacks a rationale`);
    });
  });
  add('questions', 'Three questions; every option has a rationale', qs.length >= 3 && qProblems.length === 0,
    qs.length < 3 ? `${qs.length} question(s)` : qProblems.join('; ') || undefined);

  // ---------- evidence ----------
  const refs = Array.isArray(l.references) ? l.references : [];
  const refMap = new Map(refs.map((r) => [r?.id, r]));
  refs.forEach((r, i) => {
    if (!isStr(r?.id) || !isStr(r?.citation) || !isStr(r?.usedFor) || typeof r?.consulted !== 'boolean')
      errors.push(`references[${i}]: id, citation, usedFor and consulted are required.`);
  });
  add('references', 'At least one reference that was actually consulted', refs.some((r) => r?.consulted === true));

  const claims = Array.isArray(l.claims) ? l.claims : [];
  claims.forEach((c, i) => {
    if (!isStr(c?.id) || !isStr(c?.text) || !['checked', 'analogy', 'pending'].includes(c?.status))
      errors.push(`claims[${i}]: id, text and a valid status are required.`);
    if (c?.status === 'checked') {
      if (!Array.isArray(c.refs) || c.refs.length === 0) errors.push(`claims[${i}] (${c.id}): "checked" claims must cite a reference.`);
      else
        for (const rid of c.refs) {
          const r = refMap.get(rid);
          if (!r) errors.push(`claims[${i}] (${c.id}): unknown reference "${rid}".`);
          else if (!r.consulted) errors.push(`claims[${i}] (${c.id}): cites "${rid}", which was not consulted — mark the claim "pending".`);
        }
      if (c.refs?.length && c.refs.every((rid) => refMap.get(rid)?.kind === 'reviewer'))
        errors.push(`claims[${i}] (${c.id}): "checked" needs an external source — the reviewer alone cannot verify itself.`);
    }
  });
  add('claims', 'Accuracy ledger lists the lesson’s key claims', claims.length > 0);

  const ver = l.verification;
  if (!ver || !['source-checked', 'partially-checked', 'pending-verification'].includes(ver.status))
    errors.push('verification.status is required.');
  else if (ver.humanExpertReview && !isStr(ver.reviewer))
    errors.push('verification.humanExpertReview is true but no reviewer is named.');
  if (!l.morphology || typeof l.morphology.schematicOnly !== 'boolean') errors.push('morphology.schematicOnly is required.');
  else
    (l.morphology.images ?? []).forEach((img, i) => {
      if (!isStr(img?.credit) || !isStr(img?.license)) errors.push(`morphology.images[${i}]: credit and license are required.`);
    });

  // Placeholders never count as content.
  const placeholders: string[] = [];
  const scan = (v: unknown, path: string) => {
    if (typeof v === 'string') {
      if (/\b(TODO|TBD|FIXME|lorem ipsum)\b/i.test(v)) placeholders.push(path);
    } else if (Array.isArray(v)) v.forEach((x, i) => scan(x, `${path}[${i}]`));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) scan(x, path ? `${path}.${k}` : k);
  };
  scan(l, '');
  add('no-placeholders', 'No placeholder text (TODO/TBD)', placeholders.length === 0,
    placeholders.length ? `${placeholders.length} placeholder(s), e.g. ${placeholders.slice(0, 3).join(', ')}` : undefined);

  const complete = errors.length === 0 && checklist.every((c) => c.ok);
  return { errors, checklist, complete };
}

/** Review state for a lesson: completed lessons can still require review. */
export function reviewNeeds(lesson: Lesson): string[] {
  const needs: string[] = [];
  if (!lesson.verification.humanExpertReview) needs.push('No human expert review has occurred.');
  if (lesson.verification.status !== 'source-checked') needs.push(`Verification status: ${lesson.verification.status}.`);
  const pending = lesson.claims.filter((c) => c.status === 'pending').length;
  if (pending) needs.push(`${pending} claim(s) awaiting verification.`);
  const open = lesson.accuracyFlags.filter((f) => f.status === 'open').length;
  if (open) needs.push(`${open} open accuracy flag(s).`);
  if (lesson.reviewer.status !== 'mapped') needs.push('Not mapped to a reviewer chapter/section.');
  return needs;
}

export function validateCurriculum(c: Curriculum): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const all: { id: string; prereqs: string[] }[] = [];
  for (const d of c.domains) {
    if (ids.has(d.id)) errors.push(`Duplicate id ${d.id}`);
    ids.add(d.id);
    for (const t of d.topics) {
      if (ids.has(t.id)) errors.push(`Duplicate id ${t.id}`);
      ids.add(t.id);
      for (const k of t.concepts) {
        if (ids.has(k.id)) errors.push(`Duplicate id ${k.id}`);
        ids.add(k.id);
        all.push({ id: k.id, prereqs: k.prerequisites });
      }
    }
  }
  const conceptIds = new Set(all.map((a) => a.id));
  for (const a of all) for (const p of a.prereqs) if (!conceptIds.has(p)) errors.push(`${a.id}: unknown prerequisite ${p}`);
  // cycle detection
  const graph = new Map(all.map((a) => [a.id, a.prereqs]));
  const state = new Map<string, 1 | 2>();
  const visit = (id: string, path: string[]): void => {
    if (state.get(id) === 2) return;
    if (state.get(id) === 1) {
      errors.push(`Prerequisite cycle: ${[...path, id].join(' → ')}`);
      return;
    }
    state.set(id, 1);
    for (const p of graph.get(id) ?? []) visit(p, [...path, id]);
    state.set(id, 2);
  };
  for (const a of all) visit(a.id, []);
  return errors;
}
