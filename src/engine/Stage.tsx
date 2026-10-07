import type { Scene } from '../schema/types';
import { resolveProps } from './timeline';
import { VisualContext, VisualNode } from './visuals';

export const STAGE_W = 960;
export const STAGE_H = 540;

/** Renders one scene at an absolute lesson time. Pure: same inputs, same picture. */
export function Stage({ scene, time, reducedMotion, label }: { scene: Scene; time: number; reducedMotion: boolean; label: string }) {
  const local = Math.max(0, time - scene.start);
  return (
    <VisualContext.Provider value={{ time: local, reducedMotion }}>
      <svg className="stage-svg" viewBox={`0 0 ${STAGE_W} ${STAGE_H}`} role="img" aria-label={label} preserveAspectRatio="xMidYMid meet">
        <rect width={STAGE_W} height={STAGE_H} fill="var(--stage-bg)" />
        <g opacity={0.5}>
          {Array.from({ length: 12 }, (_, i) => (
            <circle key={i} cx={(i * 173) % STAGE_W} cy={(i * 97) % STAGE_H} r={2.5} fill="var(--line)" />
          ))}
        </g>
        {scene.objects.map((o) => (
          <VisualNode key={o.id} id={`${scene.id}-${o.id}`} type={o.type} p={resolveProps(o, local)} />
        ))}
      </svg>
    </VisualContext.Provider>
  );
}
