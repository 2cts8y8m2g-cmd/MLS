/**
 * MEMORY LAB content schema.
 *
 * Lessons are plain JSON files in /content/lessons. Nothing in this file renders
 * anything — the player and visual registry interpret this data. Adding a lesson
 * never requires touching application code unless it needs a brand-new visual type.
 */

export type TrackId = 'ascp' | 'mtle';

/** The eight required teaching beats, in order. */
export const SCENE_KINDS = [
  'hook',
  'normal',
  'change',
  'lab',
  'exam',
  'memory',
  'check',
  'takeaway',
] as const;
export type SceneKind = (typeof SCENE_KINDS)[number];

export const SCENE_KIND_LABELS: Record<SceneKind, string> = {
  hook: 'Hook',
  normal: 'Normal process',
  change: 'What changes',
  lab: 'Laboratory connection',
  exam: 'Exam distinction',
  memory: 'Memory aid',
  check: 'Understanding check',
  takeaway: 'Takeaway',
};

export type Ease = 'linear' | 'in' | 'out' | 'inOut' | 'step';

/**
 * A keyframe. `t` is seconds relative to the scene start. Every other key is a
 * property of the visual object; numbers are interpolated, everything else steps.
 */
export interface Keyframe {
  t: number;
  ease?: Ease;
  [prop: string]: number | string | boolean | undefined;
}

/** Visual object types understood by the renderer (see src/engine/visuals). */
export const VISUAL_TYPES = [
  'rbc',
  'antibody',
  'cellField',
  'tube',
  'dropper',
  'centrifuge',
  'gradeScale',
  'table',
  'label',
  'arrow',
  'card',
  'mascot',
  'specimen',
  'highlight',
  'bubble',
  'building',
  'document',
  'token',
  'bin',
  'icon',
  'prion',
  'autoclave',
  'bellCurve',
] as const;
export type VisualType = (typeof VISUAL_TYPES)[number];

export interface VisualObject {
  id: string;
  type: VisualType;
  /** Initial property values. */
  props: Record<string, number | string | boolean | string[] | (string | number)[][]>;
  /** Animation instructions. Times are relative to the scene start. */
  keys?: Keyframe[];
}

/** One caption cue. Times are absolute lesson seconds. */
export interface Cue {
  id: string;
  start: number;
  end: number;
  /** On-screen caption text. */
  text: string;
  /** Optional narration script if it should differ from the caption. */
  narration?: string;
}

export interface Scene {
  id: string;
  kind: SceneKind;
  title: string;
  /** Absolute lesson seconds. */
  start: number;
  end: number;
  cues: Cue[];
  objects: VisualObject[];
  /** Text alternative describing what the scene shows (screen readers, reduced motion). */
  altText: string;
}

/**
 * A place in the source reviewer. The reviewer is a reflowable EPUB with no fixed
 * page numbers, so locations are chapter + section (+ item number within the section).
 */
export interface ReviewerLocation {
  chapter: number;
  /** Section heading, e.g. "High-Yield Hits", "Number Vault", "Exam Traps", "Figure". */
  section: string;
  /** 1-based item numbers within the section (bullet, table row, trap), if specific. */
  items?: number[];
}

/** Where a lesson came from in the user's reviewer. */
export interface ReviewerMapping {
  status: 'mapped' | 'unmapped-reviewer-unavailable' | 'not-in-reviewer';
  locations: ReviewerLocation[];
  note: string;
}

export type ClaimStatus = 'checked' | 'analogy' | 'pending';

/** A scientific statement and how well it is supported. */
export interface Claim {
  id: string;
  text: string;
  status: ClaimStatus;
  /** Reference ids from lesson.references. Required when status is 'checked'. */
  refs?: string[];
  note?: string;
}

export interface Reference {
  id: string;
  citation: string;
  url?: string;
  doi?: string;
  /** True only if the content was actually read while writing the lesson. */
  consulted: boolean;
  /**
   * 'reviewer' = the user's source reviewer (the curriculum foundation, not an
   * authority). A claim is 'checked' only when an external source supports it.
   */
  kind?: 'reviewer' | 'external';
  /** For kind 'reviewer': where in the reviewer. */
  locations?: ReviewerLocation[];
  pages?: string;
  license?: string;
  usedFor: string;
}

export interface AccuracyFlag {
  id: string;
  issue: string;
  kind: 'outdated' | 'contradiction' | 'missing-context' | 'uncertain' | 'method-dependent' | 'guideline-dependent';
  status: 'open' | 'resolved';
  resolution?: string;
}

export interface Explanation {
  /** 1. What is happening? */
  what: string;
  /** 2. Why does it happen? */
  why: string;
  /** 3. What does the laboratory measure or observe? */
  measure: string;
  /** 4. How does it differ from similar concepts? */
  differs: string;
  /** 5. How could an examination test it? */
  examAngle: string;
}

export interface Comparison {
  id: string;
  title: string;
  left: { label: string; points: string[] };
  right: { label: string; points: string[] };
  /** The single feature that separates them. */
  distinguisher: string;
}

export interface Mnemonic {
  text: string;
  explanation: string;
  /** Where the analogy stops matching the real science. */
  limitation: string;
}

export interface QuestionOption {
  id: string;
  text: string;
  /** Why this option is right, or why it is wrong. */
  rationale: string;
}

export interface Question {
  id: string;
  stem: string;
  options: QuestionOption[];
  answer: string;
  /** Skill tag used for weak-area analysis. */
  skill: string;
  difficulty: 'recall' | 'application' | 'analysis';
}

export interface Verification {
  status: 'source-checked' | 'partially-checked' | 'pending-verification';
  /** Must stay false unless a qualified human actually reviewed the lesson. */
  humanExpertReview: boolean;
  reviewer: string | null;
  notes: string;
}

export interface Lesson {
  schemaVersion: 1;
  id: string;
  title: string;
  summary: string;
  domain: string;
  topic: string;
  conceptIds: string[];
  tracks: TrackId[];
  reviewer: ReviewerMapping;
  prerequisites: string[];
  objectives: string[];
  /** Total lesson length in seconds (must equal the last scene's end). */
  duration: number;
  scenes: Scene[];
  explanation: Explanation;
  comparisons: Comparison[];
  mnemonic: Mnemonic;
  analogyLimitations: string[];
  takeaway: string;
  questions: Question[];
  references: Reference[];
  claims: Claim[];
  accuracyFlags: AccuracyFlag[];
  morphology: { schematicOnly: boolean; note: string; images: { src: string; alt: string; credit: string; license: string }[] };
  verification: Verification;
  revisedAt: string;
}

/* ---------- Curriculum ---------- */

export interface Concept {
  id: string;
  title: string;
  tracks: TrackId[];
  prerequisites: string[];
  /** Where in the user's reviewer this concept appears. null = not in the reviewer. */
  reviewerRef: ReviewerLocation | null;
  /** What kind of reviewer item the concept came from. */
  kind: 'core' | 'hit' | 'table' | 'figure' | 'trap' | 'special' | 'gap';
  /** Cognitive tags the reviewer attaches, e.g. interpret, calculate. */
  skills?: string[];
  notes?: string;
}

export interface Topic {
  id: string;
  title: string;
  /** Reviewer chapter number this topic corresponds to. */
  reviewerChapter?: number;
  /** Number of reviewer Exam Simulator questions tagged to this chapter (questions are not imported). */
  simulatorQuestions?: number;
  concepts: Concept[];
}

export interface Domain {
  id: string;
  title: string;
  tracks: TrackId[];
  /** Position in the recommended learning sequence (lower first). */
  sequence: number;
  /** Reviewer Part (e.g. "V") or null for subjects the reviewer does not cover. */
  reviewerPart?: string | null;
  topics: Topic[];
  notes?: string;
}

export interface Curriculum {
  provenance: {
    status: 'provisional' | 'reviewer-derived';
    /** How concept labels were produced (e.g. auto-derived from reviewer bullets). */
    labelNote?: string;
    statement: string;
    revisedAt: string;
  };
  domains: Domain[];
}

/* ---------- Tracks ---------- */

export interface TrackArea {
  name: string;
  weight: string;
  weightVerified: boolean;
  domains: string[];
  note?: string;
}

export interface Track {
  id: TrackId;
  name: string;
  shortName: string;
  body: string;
  outline: {
    title: string;
    url: string;
    verified: boolean;
    verificationNote: string;
    checkedAt: string;
  }[];
  areas: TrackArea[];
  format: string;
  trackOnlyNotes: string[];
}

/* ---------- Reviewer (source document) ---------- */

export interface ReviewerChapter {
  id: string;
  n: number;
  title: string;
  part: string;
  partTitle: string;
  sections: string[];
  counts: { highYield: number; memoryHooks: number; tableRows: number; tables: number; figures: number; traps: number; recall: number; special: number; simulatorQuestions: number };
  status: 'not-started' | 'inventoried' | 'in-progress' | 'complete';
}

export interface ReviewerStatus {
  received: boolean;
  fileName: string | null;
  title?: string;
  author?: string;
  edition?: string;
  format?: string;
  pagesAccessible: string | null;
  /** False for reflowable EPUBs: lessons cite chapter/section/item instead of pages. */
  hasPageNumbers?: boolean;
  statement: string;
  backMatter?: { name: string; description: string; usedInApp: string }[];
  selfReportedReview?: string;
  chapters: ReviewerChapter[];
}
