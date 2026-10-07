import { SCENE_KINDS, SCENE_KIND_LABELS, type Lesson } from './types';

/**
 * A structurally valid starting point for a new lesson. Every text field says TODO,
 * so the completeness check fails until real content replaces it.
 */
export function lessonTemplate(id = 'new-lesson'): Lesson {
  const len = 20;
  return {
    schemaVersion: 1,
    id,
    title: 'TODO: lesson title',
    summary: 'TODO: one-sentence summary',
    domain: 'TODO-domain-id',
    topic: 'TODO-topic-id',
    conceptIds: [],
    tracks: ['ascp', 'mtle'],
    reviewer: { status: 'mapped', locations: [], note: 'TODO: reviewer mapping (chapter, section, items)' },
    prerequisites: [],
    objectives: ['TODO: objective'],
    duration: len * SCENE_KINDS.length,
    scenes: SCENE_KINDS.map((kind, i) => ({
      id: kind,
      kind,
      title: `TODO: ${SCENE_KIND_LABELS[kind]}`,
      start: i * len,
      end: (i + 1) * len,
      altText: 'TODO: describe what this scene shows',
      cues: [{ id: `${kind}-1`, start: i * len, end: i * len + 8, text: `TODO: ${SCENE_KIND_LABELS[kind]} caption` }],
      objects: [
        {
          id: 'title',
          type: 'label',
          props: { x: 480, y: 270, text: SCENE_KIND_LABELS[kind], size: 34, opacity: 0 },
          keys: [{ t: 0, opacity: 0, scale: 0.7 }, { t: 1, opacity: 1, scale: 1, ease: 'out' }],
        },
      ],
    })),
    explanation: { what: 'TODO', why: 'TODO', measure: 'TODO', differs: 'TODO', examAngle: 'TODO' },
    comparisons: [],
    mnemonic: { text: 'TODO', explanation: 'TODO', limitation: 'TODO' },
    analogyLimitations: [],
    takeaway: 'TODO: one sentence.',
    questions: [],
    references: [],
    claims: [],
    accuracyFlags: [],
    morphology: { schematicOnly: true, note: 'TODO', images: [] },
    verification: { status: 'pending-verification', humanExpertReview: false, reviewer: null, notes: 'TODO' },
    revisedAt: new Date().toISOString().slice(0, 10),
  };
}
