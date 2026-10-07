import { createContext, useContext, type ReactNode } from 'react';
import type { VisualType } from '../../schema/types';
import type { Props } from '../timeline';

/**
 * Reusable cartoon visual components. Each draws around its own origin and is
 * positioned by the shared wrapper (x, y, scale, rotate, opacity). All colors come
 * from CSS variables so light/dark themes work. These are schematic drawings —
 * not to scale and not a substitute for real microscopic or tube appearances.
 */

export interface VisualCtx {
  /** Scene-relative time in seconds (for continuous effects like pulsing). */
  time: number;
  reducedMotion: boolean;
}
export const VisualContext = createContext<VisualCtx>({ time: 0, reducedMotion: false });

const num = (p: Props, k: string, d: number) => (typeof p[k] === 'number' ? (p[k] as number) : d);
const str = (p: Props, k: string, d: string) => (typeof p[k] === 'string' ? (p[k] as string) : d);
const bool = (p: Props, k: string, d: boolean) => (typeof p[k] === 'boolean' ? (p[k] as boolean) : d);
const strArr = (p: Props, k: string): string[] => (Array.isArray(p[k]) ? (p[k] as unknown[]).map(String) : []);
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));

/** Named color tokens authors can use instead of raw CSS colors. */
const TOKENS: Record<string, string> = {
  ink: 'var(--ink)',
  muted: 'var(--muted)',
  accent: 'var(--accent)',
  a: 'var(--ag-a)',
  b: 'var(--ag-b)',
  h: 'var(--ag-h)',
  good: 'var(--good)',
  warn: 'var(--warn)',
  bad: 'var(--bad)',
  plasma: 'var(--plasma)',
  saline: 'var(--saline)',
  blood: 'var(--rbc)',
  surface: 'var(--stage-card)',
};
export const color = (c: string) => TOKENS[c] ?? c;

/** Wraps text to lines of roughly maxChars characters (SVG has no auto-wrap). */
export function wrap(text: string, maxChars: number): string[] {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/)) {
      if (!word) continue;
      if (line && (line + ' ' + word).length > maxChars) {
        out.push(line);
        line = word;
      } else line = line ? line + ' ' + word : word;
    }
    out.push(line);
  }
  return out;
}

function Text({ lines, size, fill, anchor = 'middle', weight = 500, lineHeight = 1.25 }: {
  lines: string[]; size: number; fill: string; anchor?: 'start' | 'middle' | 'end'; weight?: number; lineHeight?: number;
}) {
  const offset = -((lines.length - 1) * size * lineHeight) / 2;
  return (
    <text textAnchor={anchor} fontSize={size} fill={fill} fontWeight={weight} dominantBaseline="central">
      {lines.map((ln, i) => (
        <tspan key={i} x={0} y={offset + i * size * lineHeight}>{ln}</tspan>
      ))}
    </text>
  );
}

/* ---------------- antigens & antibodies ---------------- */

function AntigenMark({ kind, size = 7 }: { kind: 'A' | 'B' | 'H'; size?: number }) {
  // Drawn as a "flag" on a short stalk rooted at the membrane (y = +size).
  const stalk = <line x1={0} y1={size} x2={0} y2={-size * 0.1} stroke={kind === 'H' ? 'var(--ag-h)' : 'var(--outline)'} strokeWidth={1.6} />;
  if (kind === 'A')
    return (
      <g>
        {stalk}
        <path d={`M0,${-size * 1.05} L${size * 0.75},${size * 0.15} L${-size * 0.75},${size * 0.15} Z`} fill="var(--ag-a)" stroke="var(--outline)" strokeWidth={1} />
      </g>
    );
  if (kind === 'B')
    return (
      <g>
        {stalk}
        <rect x={-size * 0.6} y={-size * 1.05} width={size * 1.2} height={size * 1.2} rx={2} fill="var(--ag-b)" stroke="var(--outline)" strokeWidth={1} />
      </g>
    );
  return (
    <g>
      {stalk}
      <circle cx={0} cy={-size * 0.35} r={size * 0.38} fill="var(--ag-h)" />
    </g>
  );
}

function antigenList(antigen: string, n: number): ('A' | 'B' | 'H')[] {
  switch (antigen) {
    case 'A':
      return Array(n).fill('A');
    case 'B':
      return Array(n).fill('B');
    case 'AB':
      return Array.from({ length: n }, (_, i) => (i % 2 ? 'B' : 'A'));
    case 'O':
      return Array(n).fill('H');
    default:
      return []; // 'none' — e.g. Bombay (Oh): no A, B or H
  }
}

function RbcShape({ r, antigen, face, mood, antigenCount }: { r: number; antigen: string; face: boolean; mood: string; antigenCount: number }) {
  const ags = antigenList(antigen, antigenCount);
  return (
    <g>
      {ags.map((k, i) => {
        const a = (i / ags.length) * Math.PI * 2 - Math.PI / 2;
        const deg = (a * 180) / Math.PI + 90;
        return (
          <g key={i} transform={`translate(${Math.cos(a) * (r + Math.max(4, r * 0.2))},${Math.sin(a) * (r + Math.max(4, r * 0.2))}) rotate(${deg})`}>
            <AntigenMark kind={k} size={Math.max(4, r * 0.2)} />
          </g>
        );
      })}
      <circle r={r} fill="var(--rbc)" stroke="var(--rbc-edge)" strokeWidth={2} />
      <circle r={r * 0.45} fill="var(--rbc-pallor)" opacity={0.8} />
      {face && (
        <g>
          <circle cx={-r * 0.28} cy={-r * 0.12} r={r * 0.08} fill="var(--face)" />
          <circle cx={r * 0.28} cy={-r * 0.12} r={r * 0.08} fill="var(--face)" />
          {mood === 'worried' ? (
            <path d={`M${-r * 0.22},${r * 0.32} Q0,${r * 0.16} ${r * 0.22},${r * 0.32}`} stroke="var(--face)" strokeWidth={2} fill="none" strokeLinecap="round" />
          ) : mood === 'neutral' ? (
            <line x1={-r * 0.2} y1={r * 0.26} x2={r * 0.2} y2={r * 0.26} stroke="var(--face)" strokeWidth={2} strokeLinecap="round" />
          ) : (
            <path d={`M${-r * 0.24},${r * 0.18} Q0,${r * 0.42} ${r * 0.24},${r * 0.18}`} stroke="var(--face)" strokeWidth={2} fill="none" strokeLinecap="round" />
          )}
        </g>
      )}
    </g>
  );
}

function Rbc({ p }: { p: Props }) {
  const r = num(p, 'r', 34);
  const hl = num(p, 'highlight', 0);
  const label = str(p, 'label', '');
  return (
    <g>
      {hl > 0 && <circle r={r + 16} fill="none" stroke="var(--accent)" strokeWidth={4} opacity={hl} />}
      <RbcShape r={r} antigen={str(p, 'antigen', 'A')} face={bool(p, 'face', true)} mood={str(p, 'mood', 'happy')} antigenCount={num(p, 'antigens', 10)} />
      {label && (() => {
        const lines = wrap(label, 18);
        const size = num(p, 'labelSize', 16);
        return (
          <g transform={`translate(0,${r * 1.45 + 14 + ((lines.length - 1) * size * 1.25) / 2})`}>
            <Text lines={lines} size={size} fill="var(--ink)" weight={600} />
          </g>
        );
      })()}
    </g>
  );
}

const SPEC_COLOR: Record<string, string> = { A: 'var(--ag-a)', B: 'var(--ag-b)', H: 'var(--ag-h)', AB: 'var(--ag-ab)' };

function AntibodyShape({ spec, cls, size }: { spec: string; cls: string; size: number }) {
  const c = SPEC_COLOR[spec] ?? 'var(--accent)';
  const arm = (angle: number, key: number) => (
    <g key={key} transform={`rotate(${angle})`}>
      <line x1={0} y1={-size * 0.18} x2={0} y2={-size * 0.62} stroke={c} strokeWidth={size * 0.09} strokeLinecap="round" />
      <line x1={0} y1={-size * 0.62} x2={-size * 0.2} y2={-size * 0.9} stroke={c} strokeWidth={size * 0.09} strokeLinecap="round" />
      <line x1={0} y1={-size * 0.62} x2={size * 0.2} y2={-size * 0.9} stroke={c} strokeWidth={size * 0.09} strokeLinecap="round" />
    </g>
  );
  if (cls === 'IgG') {
    return <g transform={`translate(0,${size * 0.35})`}>{arm(0, 0)}<circle r={size * 0.12} fill={c} /></g>;
  }
  // IgM pentamer: five Y-shaped units = ten binding tips.
  return (
    <g>
      {[0, 72, 144, 216, 288].map((a, i) => arm(a, i))}
      <circle r={size * 0.2} fill={c} stroke="var(--outline)" strokeWidth={1} />
    </g>
  );
}

function Antibody({ p }: { p: Props }) {
  const size = num(p, 'size', 36);
  const label = str(p, 'label', '');
  const lines = wrap(label, 16);
  return (
    <g>
      <g transform={`rotate(${num(p, 'spin', 0)})`}>
        <AntibodyShape spec={str(p, 'spec', 'A')} cls={str(p, 'cls', 'IgM')} size={size} />
      </g>
      {label && <g transform={`translate(0,${size + 18 + ((lines.length - 1) * 15 * 1.25) / 2})`}><Text lines={lines} size={15} fill="var(--ink)" weight={600} /></g>}
    </g>
  );
}

/* ---------------- agglutination field ---------------- */

/** Deterministic pseudo-random numbers so layouts are identical on every render. */
function rand(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function hexCluster(n: number, d: number): [number, number][] {
  const pts: [number, number][] = [[0, 0]];
  let ring = 1;
  while (pts.length < n) {
    for (let side = 0; side < 6 && pts.length < n; side++) {
      for (let k = 0; k < ring && pts.length < n; k++) {
        const a0 = (side * Math.PI) / 3;
        const a1 = ((side + 1) * Math.PI) / 3;
        const x = ring * d * Math.cos(a0) + ((k * d) * (Math.cos(a1) - Math.cos(a0)));
        const y = ring * d * Math.sin(a0) + ((k * d) * (Math.sin(a1) - Math.sin(a0)));
        pts.push([x, y]);
      }
    }
    ring++;
  }
  return pts;
}

function CellField({ p }: { p: Props }) {
  const w = num(p, 'w', 300);
  const h = num(p, 'h', 200);
  const n = Math.round(num(p, 'count', 7));
  const r = num(p, 'cellR', 18);
  const clump = clamp(num(p, 'clump', 0));
  const bound = clamp(num(p, 'bound', 0));
  const free = clamp(num(p, 'free', 0));
  const hemo = clamp(num(p, 'hemolysis', 0));
  const antigen = str(p, 'antigen', 'A');
  const spec = str(p, 'spec', 'A');
  const rnd = rand(num(p, 'seed', 7));
  const disp: [number, number][] = Array.from({ length: n }, (_, i) => {
    const cols = Math.ceil(Math.sqrt(n * (w / h)));
    const rows = Math.ceil(n / cols);
    const cx = ((i % cols) + 0.5) * (w / cols) - w / 2 + (rnd() - 0.5) * (w / cols) * 0.4;
    const cy = (Math.floor(i / cols) + 0.5) * (h / rows) - h / 2 + (rnd() - 0.5) * (h / rows) * 0.4;
    return [cx, cy];
  });
  const clus = hexCluster(n, r * 2.5);
  const pos = disp.map(([x, y], i) => [x + (clus[i][0] - x) * clump, y + (clus[i][1] - y) * clump] as [number, number]);
  // antibody bridges between neighbouring cells in the final lattice
  const bridges: [number, number][] = [];
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const dx = clus[i][0] - clus[j][0];
      const dy = clus[i][1] - clus[j][1];
      if (Math.hypot(dx, dy) < r * 2.6) bridges.push([i, j]);
    }
  const freeAb = Array.from({ length: Math.round(n * 0.8) }, () => [(rnd() - 0.5) * w, (rnd() - 0.5) * h] as [number, number]);
  return (
    <g>
      <rect x={-w / 2 - 10} y={-h / 2 - 10} width={w + 20} height={h + 20} rx={18} fill="var(--stage-card)" stroke="var(--line)" strokeWidth={1.5} />
      {hemo > 0 && <rect x={-w / 2 - 10} y={-h / 2 - 10} width={w + 20} height={h + 20} rx={18} fill="var(--rbc)" opacity={hemo * 0.35} />}
      {free * (1 - bound) > 0.01 && freeAb.map(([x, y], i) => (
        <g key={`f${i}`} transform={`translate(${x},${y}) rotate(${i * 37})`} opacity={free * (1 - bound)}>
          <AntibodyShape spec={spec} cls={str(p, 'cls', 'IgM')} size={14} />
        </g>
      ))}
      {pos.map(([x, y], i) => (
        <g key={i} className="cell" transform={`translate(${x},${y})`} opacity={1 - hemo * 0.8}>
          <RbcShape r={r} antigen={antigen} face={bool(p, 'face', false)} mood="happy" antigenCount={8} />
        </g>
      ))}
      {bound > 0 && bridges.map(([i, j], k) => {
        const mx = (pos[i][0] + pos[j][0]) / 2;
        const my = (pos[i][1] + pos[j][1]) / 2;
        return (
          <g key={`b${k}`} transform={`translate(${mx},${my})`} opacity={bound}>
            <AntibodyShape spec={spec} cls={str(p, 'cls', 'IgM')} size={r * 0.75} />
          </g>
        );
      })}
      {str(p, 'label', '') && (
        <g transform={`translate(0,${h / 2 + 28})`}><Text lines={[str(p, 'label', '')]} size={16} fill="var(--ink)" weight={600} /></g>
      )}
    </g>
  );
}

/* ---------------- tube, dropper, centrifuge, specimen ---------------- */

const TUBE_W = 46;
const TUBE_H = 170;
const tubePath = `M${-TUBE_W / 2},0 L${-TUBE_W / 2},${TUBE_H - TUBE_W / 2} A${TUBE_W / 2},${TUBE_W / 2} 0 0 0 ${TUBE_W / 2},${TUBE_H - TUBE_W / 2} L${TUBE_W / 2},0`;

function clumpPattern(grade: number): { n: number; r: number } {
  if (grade >= 3.5) return { n: 1, r: 16 };
  if (grade >= 2.5) return { n: 3, r: 9 };
  if (grade >= 1.5) return { n: 6, r: 5.5 };
  if (grade >= 0.5) return { n: 12, r: 3 };
  return { n: 0, r: 0 };
}

function Tube({ p, id }: { p: Props; id: string }) {
  const level = clamp(num(p, 'level', 0.55));
  const cells = clamp(num(p, 'cells', 0));
  const settle = clamp(num(p, 'settle', 0));
  const shake = clamp(num(p, 'shake', 0));
  const grade = clamp(num(p, 'grade', 0), 0, 4);
  const hemo = clamp(num(p, 'hemolysis', 0));
  // 0–1: the fluid sets into a gel clot (e.g. tube coagulase).
  const clot = clamp(num(p, 'clot', 0));
  const hl = num(p, 'highlight', 0);
  const fluid = color(str(p, 'fluid', 'saline'));
  const label = str(p, 'label', '');
  const result = str(p, 'result', '');
  // Optional stopper colour (a real tube-cap colour such as '#8ec9ee'); identifies the additive.
  const cap = str(p, 'cap', '');
  const clipId = `tube-clip-${id}`;
  const top = TUBE_H * (1 - level);
  const { n, r } = clumpPattern(grade);
  const rnd = rand(Math.round(grade * 10) + 3);
  // Background redness after resuspension: weaker reactions leave more free cells.
  const freeCells = grade < 0.5 ? 1 : grade < 1.5 ? 0.45 : grade < 2.5 ? 0.18 : grade < 3.5 ? 0.06 : 0;
  const suspended = cells * (1 - settle) + cells * shake;
  return (
    <g>
      {hl > 0 && <rect x={-TUBE_W / 2 - 12} y={-14} width={TUBE_W + 24} height={TUBE_H + 26} rx={22} fill="none" stroke="var(--accent)" strokeWidth={4} opacity={hl} />}
      <defs>
        <clipPath id={clipId}><path d={tubePath + ' Z'} /></clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect x={-TUBE_W / 2} y={top} width={TUBE_W} height={TUBE_H - top + 2} fill={fluid} />
        {hemo > 0 && <rect x={-TUBE_W / 2} y={top} width={TUBE_W} height={TUBE_H - top + 2} fill="var(--hemolysate)" opacity={hemo * 0.85} />}
        {clot > 0 && (
          <g opacity={clot}>
            <rect x={-TUBE_W / 2} y={top} width={TUBE_W} height={TUBE_H - top + 2} fill="var(--ag-a)" opacity={0.45} />
            {[0, 1, 2, 3, 4].map((i) => (
              <path key={i} d={`M${-TUBE_W / 2} ${top + 14 + i * 22} q ${TUBE_W / 4} -10 ${TUBE_W / 2} 0 t ${TUBE_W / 2} 0`} fill="none" stroke="var(--ink)" strokeOpacity={0.45} strokeWidth={1.5} />
            ))}
          </g>
        )}
        {/* evenly suspended cells */}
        {suspended > 0 && (
          <rect x={-TUBE_W / 2} y={top} width={TUBE_W} height={TUBE_H - top + 2} fill="var(--rbc)"
            opacity={clamp(suspended * (shake > 0 ? freeCells * shake + (1 - shake) : 1) * 0.75 * (1 - hemo))} />
        )}
        {/* cell button after centrifugation */}
        {settle > 0 && shake < 1 && (
          <ellipse cx={0} cy={TUBE_H - 10} rx={TUBE_W * 0.32} ry={7} fill="var(--rbc)" opacity={cells * settle * (1 - shake) * (1 - hemo)} />
        )}
        {/* agglutinates seen when the button is gently resuspended */}
        {shake > 0 && n > 0 && Array.from({ length: n }, (_, i) => {
          const cx = n === 1 ? 0 : (rnd() - 0.5) * (TUBE_W - 2 * r - 6);
          const cy = TUBE_H - 30 - rnd() * (TUBE_H - top - 50);
          return <circle key={i} cx={cx} cy={cy} r={r} fill="var(--rbc)" stroke="var(--rbc-edge)" strokeWidth={1} opacity={cells * shake * (1 - hemo)} />;
        })}
      </g>
      <path d={tubePath} fill="none" stroke="var(--glass)" strokeWidth={3} strokeLinejoin="round" />
      <line x1={-TUBE_W / 2 - 6} y1={0} x2={TUBE_W / 2 + 6} y2={0} stroke="var(--glass)" strokeWidth={4} strokeLinecap="round" />
      <rect x={-TUBE_W / 2 + 7} y={10} width={5} height={TUBE_H * 0.55} rx={2.5} fill="#fff" opacity={0.35} />
      {cap && <rect x={-TUBE_W / 2 - 5} y={-30} width={TUBE_W + 10} height={30} rx={6} fill={color(cap)} stroke="var(--line)" strokeWidth={1.5} />}
      {label && <g transform={`translate(0,${cap ? -50 : -26})`}><Text lines={wrap(label, 12)} size={15} fill="var(--ink)" weight={700} /></g>}
      {result && (
        <g transform={`translate(0,${TUBE_H + 26})`}>
          <rect x={-34} y={-15} width={68} height={30} rx={15} fill={result.trim().startsWith('0') ? 'var(--chip-neg)' : 'var(--chip-pos)'} />
          <Text lines={[result]} size={16} fill="var(--ink)" weight={800} />
        </g>
      )}
    </g>
  );
}

function Dropper({ p }: { p: Props }) {
  const drop = clamp(num(p, 'drop', 0));
  const dist = num(p, 'dropDistance', 70);
  const c = color(str(p, 'color', 'saline'));
  const label = str(p, 'label', '');
  return (
    <g>
      <rect x={-12} y={-90} width={24} height={34} rx={11} fill="var(--bulb)" />
      <path d="M-9,-58 L9,-58 L4,-4 L-4,-4 Z" fill="var(--glass-fill)" stroke="var(--glass)" strokeWidth={2} />
      <path d="M-6,-34 L6,-34 L4,-6 L-4,-6 Z" fill={c} opacity={0.9} />
      {drop > 0 && drop < 1 && <circle cx={0} cy={4 + drop * dist} r={6} fill={c} stroke="var(--outline)" strokeWidth={1} />}
      {label && <g transform="translate(0,-108)"><Text lines={wrap(label, 14)} size={14} fill="var(--ink)" weight={700} /></g>}
    </g>
  );
}

function Centrifuge({ p }: { p: Props }) {
  const spin = num(p, 'spin', 0);
  const label = str(p, 'label', 'Centrifuge');
  return (
    <g>
      <rect x={-90} y={-70} width={180} height={140} rx={24} fill="var(--device)" stroke="var(--line)" strokeWidth={2} />
      <circle r={52} fill="var(--device-dark)" />
      <g transform={`rotate(${spin})`}>
        {[0, 90, 180, 270].map((a) => (
          <rect key={a} x={-7} y={-48} width={14} height={30} rx={6} fill="var(--glass-fill)" stroke="var(--glass)" transform={`rotate(${a})`} />
        ))}
        <circle r={10} fill="var(--accent)" />
      </g>
      <g transform="translate(0,92)"><Text lines={[label]} size={15} fill="var(--ink)" weight={700} /></g>
    </g>
  );
}

const STOPPER: Record<string, string> = { lavender: '#a78bfa', pink: '#f472b6', red: '#dc2626', gold: '#eab308', blue: '#60a5fa', green: '#22c55e', gray: '#9ca3af' };

function Specimen({ p, id }: { p: Props; id: string }) {
  const sep = clamp(num(p, 'separated', 0));
  const top = str(p, 'top', 'lavender');
  const label = str(p, 'label', '');
  const clipId = `spec-clip-${id}`;
  const h = 130;
  const w = 38;
  const body = `M${-w / 2},0 L${-w / 2},${h - w / 2} A${w / 2},${w / 2} 0 0 0 ${w / 2},${h - w / 2} L${w / 2},0 Z`;
  return (
    <g>
      <defs><clipPath id={clipId}><path d={body} /></clipPath></defs>
      <g clipPath={`url(#${clipId})`}>
        <rect x={-w / 2} y={20} width={w} height={h} fill="var(--rbc)" />
        <rect x={-w / 2} y={20} width={w} height={(h - 20) * 0.5 * sep} fill="var(--plasma)" />
      </g>
      <path d={body} fill="none" stroke="var(--glass)" strokeWidth={3} />
      <rect x={-w / 2 - 4} y={-22} width={w + 8} height={26} rx={6} fill={STOPPER[top] ?? top} />
      {label && <g transform={`translate(0,${h + 22})`}><Text lines={wrap(label, 16)} size={14} fill="var(--ink)" weight={600} /></g>}
    </g>
  );
}

/* ---------------- information graphics ---------------- */

function GradeScale({ p }: { p: Props }) {
  const hl = num(p, 'highlight', -1);
  const reveal = num(p, 'reveal', 5);
  const grades = ['0', '1+', '2+', '3+', '4+'];
  const desc = strArr(p, 'descriptions');
  return (
    <g>
      {grades.map((g, i) => {
        const vis = clamp(reveal - i);
        if (vis <= 0) return null;
        const { n, r } = clumpPattern(i);
        const rnd = rand(i + 11);
        const active = Math.round(hl) === i;
        return (
          <g key={g} transform={`translate(${i * 150},0)`} opacity={vis}>
            <circle r={48} fill="var(--stage-card)" stroke={active ? 'var(--accent)' : 'var(--line)'} strokeWidth={active ? 5 : 2} />
            <circle r={44} fill="var(--saline)" />
            <circle r={44} fill="var(--rbc)" opacity={[0.75, 0.4, 0.18, 0.06, 0][i]} />
            {Array.from({ length: n }, (_, k) => {
              const a = rnd() * Math.PI * 2;
              const d = n === 1 ? 0 : rnd() * (40 - r * 1.6);
              return <circle key={k} cx={Math.cos(a) * d} cy={Math.sin(a) * d} r={r * 1.5} fill="var(--rbc)" stroke="var(--rbc-edge)" strokeWidth={1} />;
            })}
            <g transform="translate(0,70)"><Text lines={[g]} size={22} fill="var(--ink)" weight={800} /></g>
            {desc[i] && <g transform="translate(0,104)"><Text lines={wrap(desc[i], 16)} size={13} fill="var(--muted)" /></g>}
          </g>
        );
      })}
    </g>
  );
}

function Table({ p }: { p: Props }) {
  const cols = strArr(p, 'cols');
  const rows = (Array.isArray(p.rows) ? (p.rows as unknown[][]) : []).map((r) => r.map(String));
  const cw = num(p, 'cellW', 120);
  const ch = num(p, 'cellH', 40);
  const reveal = num(p, 'reveal', Infinity);
  const hr = Math.round(num(p, 'highlightRow', -1));
  const title = str(p, 'title', '');
  const W = cols.length * cw;
  let idx = 0;
  return (
    <g transform={`translate(${-W / 2},0)`}>
      {title && <g transform={`translate(${W / 2},-24)`}><Text lines={[title]} size={18} fill="var(--ink)" weight={800} /></g>}
      {cols.map((c, i) => (
        <g key={c + i}>
          <rect x={i * cw} y={0} width={cw} height={ch} fill="var(--table-head)" stroke="var(--line)" />
          <g transform={`translate(${i * cw + cw / 2},${ch / 2})`}><Text lines={wrap(c, Math.floor(cw / 8.5))} size={14} fill="var(--ink)" weight={800} /></g>
        </g>
      ))}
      {rows.map((row, ri) => (
        <g key={ri}>
          {row.map((cell, ci) => {
            const vis = clamp(reveal - idx++);
            const pos = /\d\+|\+$|^\+|pos/i.test(cell) && !/^0/.test(cell);
            return (
              <g key={ci}>
                <rect x={ci * cw} y={(ri + 1) * ch} width={cw} height={ch}
                  fill={ri === hr ? 'var(--accent-soft)' : 'var(--stage-card)'} stroke="var(--line)" />
                <g transform={`translate(${ci * cw + cw / 2},${(ri + 1) * ch + ch / 2})`} opacity={vis}>
                  <Text lines={wrap(cell, Math.floor(cw / 8))} size={15} fill={pos ? 'var(--pos-ink)' : 'var(--ink)'} weight={pos || ci === 0 ? 800 : 500} />
                </g>
              </g>
            );
          })}
        </g>
      ))}
    </g>
  );
}

function Label({ p }: { p: Props }) {
  const size = num(p, 'size', 22);
  const anchor = str(p, 'align', 'middle') as 'start' | 'middle' | 'end';
  const lines = wrap(str(p, 'text', ''), num(p, 'wrap', 60));
  const bg = bool(p, 'bg', false);
  const fill = color(str(p, 'color', 'ink'));
  const longest = Math.max(...lines.map((l) => l.length));
  const bw = longest * size * 0.55 + 28;
  const bh = lines.length * size * 1.25 + 14;
  const bx = anchor === 'middle' ? -bw / 2 : anchor === 'start' ? -14 : -bw + 14;
  return (
    <g>
      {bg && <rect x={bx} y={-bh / 2} width={bw} height={bh} rx={bh / 2 > 24 ? 16 : bh / 2} fill={color(str(p, 'bgColor', 'surface'))} stroke="var(--line)" />}
      <Text lines={lines} size={size} fill={fill} anchor={anchor} weight={num(p, 'weight', 600)} />
    </g>
  );
}

function Arrow({ p }: { p: Props }) {
  const x2 = num(p, 'dx', 100);
  const y2 = num(p, 'dy', 0);
  const draw = clamp(num(p, 'draw', 1));
  const c = color(str(p, 'color', 'accent'));
  const ex = x2 * draw;
  const ey = y2 * draw;
  const ang = Math.atan2(y2, x2);
  const head = 12;
  const label = str(p, 'label', '');
  return (
    <g>
      <line x1={0} y1={0} x2={ex} y2={ey} stroke={c} strokeWidth={4} strokeLinecap="round" strokeDasharray={bool(p, 'dashed', false) ? '8 8' : undefined} />
      {draw > 0.05 && (
        <path d={`M${ex},${ey} L${ex - head * Math.cos(ang - 0.45)},${ey - head * Math.sin(ang - 0.45)} L${ex - head * Math.cos(ang + 0.45)},${ey - head * Math.sin(ang + 0.45)} Z`} fill={c} />
      )}
      {label && draw > 0.5 && (
        Math.abs(y2) > Math.abs(x2) ? (
          <g transform={`translate(${x2 / 2 + 16},${y2 / 2})`} opacity={(draw - 0.5) * 2}><Text lines={wrap(label, 22)} size={14} fill="var(--ink)" weight={700} anchor="start" /></g>
        ) : (
          <g transform={`translate(${x2 / 2},${y2 / 2 - 18})`} opacity={(draw - 0.5) * 2}><Text lines={wrap(label, 22)} size={14} fill="var(--ink)" weight={700} /></g>
        )
      )}
    </g>
  );
}

const TONE_BG: Record<string, string> = {
  a: 'var(--tone-a)', b: 'var(--tone-b)', neutral: 'var(--stage-card)', warn: 'var(--tone-warn)', good: 'var(--tone-good)', bad: 'var(--tone-bad)', blood: 'var(--rbc)',
};

function Card({ p }: { p: Props }) {
  const w = num(p, 'w', 300);
  const h = num(p, 'h', 200);
  const title = str(p, 'title', '');
  const lines = strArr(p, 'lines');
  const reveal = num(p, 'reveal', lines.length);
  const size = num(p, 'size', 16);
  const maxChars = Math.floor((w - 36) / (size * 0.52));
  let y = title ? 56 : 26;
  return (
    <g transform={`translate(${-w / 2},${-h / 2})`}>
      <rect width={w} height={h} rx={18} fill={TONE_BG[str(p, 'tone', 'neutral')] ?? 'var(--stage-card)'} stroke="var(--line)" strokeWidth={1.5} />
      {title && <g transform={`translate(${w / 2},28)`}><Text lines={wrap(title, Math.floor(w / 11))} size={19} fill="var(--ink)" weight={800} /></g>}
      {lines.map((ln, i) => {
        const wrapped = wrap(ln, maxChars);
        const ty = y;
        y += wrapped.length * size * 1.3 + 8;
        return (
          <g key={i} transform={`translate(18,${ty})`} opacity={clamp(reveal - i)}>
            <text fontSize={size} fill="var(--ink)" dominantBaseline="hanging">
              {wrapped.map((wl, k) => (
                <tspan key={k} x={0} dy={k === 0 ? 0 : size * 1.3}>{k === 0 ? '• ' : '  '}{wl}</tspan>
              ))}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function Mascot({ p }: { p: Props }) {
  const expr = str(p, 'expression', 'happy');
  return (
    <g>
      <path d="M-46,110 Q-46,48 0,44 Q46,48 46,110 Z" fill="var(--coat)" stroke="var(--line)" strokeWidth={2} />
      <line x1={0} y1={48} x2={0} y2={110} stroke="var(--line)" strokeWidth={2} />
      <rect x={10} y={66} width={16} height={20} rx={3} fill="var(--accent)" opacity={0.8} />
      <circle r={40} fill="var(--skin)" stroke="var(--line)" strokeWidth={2} />
      <path d="M-40,-6 Q-38,-44 0,-44 Q38,-44 40,-6 Q20,-26 -40,-6 Z" fill="var(--hair)" />
      <rect x={-34} y={-10} width={68} height={22} rx={11} fill="var(--goggle)" stroke="var(--line)" strokeWidth={2} opacity={0.85} />
      <circle cx={-14} cy={1} r={4} fill="var(--face)" />
      <circle cx={14} cy={1} r={4} fill="var(--face)" />
      {expr === 'thinking' ? (
        <path d="M-8,25 Q0,21 4,25 T12,23" stroke="var(--face)" strokeWidth={3} fill="none" strokeLinecap="round" />
      ) : expr === 'alert' ? (
        <ellipse cx={0} cy={24} rx={6} ry={8} fill="var(--face)" />
      ) : expr === 'curious' ? (
        <circle cx={2} cy={24} r={5} fill="var(--face)" />
      ) : (
        <path d="M-14,20 Q0,34 14,20" stroke="var(--face)" strokeWidth={3} fill="none" strokeLinecap="round" />
      )}
    </g>
  );
}

function Bubble({ p }: { p: Props }) {
  const w = num(p, 'w', 280);
  const size = num(p, 'size', 18);
  const lines = wrap(str(p, 'text', ''), Math.floor((w - 30) / (size * 0.52)));
  const h = lines.length * size * 1.3 + 28;
  const tail = str(p, 'tail', 'left');
  const tailPath =
    tail === 'left' ? `M${-w / 2 + 10},${h / 2 - 22} L${-w / 2 - 22},${h / 2 - 4} L${-w / 2 + 26},${h / 2 - 4}`
      : tail === 'right' ? `M${w / 2 - 10},${h / 2 - 22} L${w / 2 + 22},${h / 2 - 4} L${w / 2 - 26},${h / 2 - 4}`
        : `M-14,${h / 2 - 2} L0,${h / 2 + 22} L14,${h / 2 - 2}`;
  return (
    <g>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={18} fill={TONE_BG[str(p, 'tone', 'neutral')] ?? 'var(--stage-card)'} stroke="var(--line)" strokeWidth={2} />
      <path d={tailPath} fill={TONE_BG[str(p, 'tone', 'neutral')] ?? 'var(--stage-card)'} stroke="var(--line)" strokeWidth={2} strokeLinejoin="round" />
      <rect x={-w / 2 + 2} y={h / 2 - 26} width={w - 4} height={22} fill={TONE_BG[str(p, 'tone', 'neutral')] ?? 'var(--stage-card)'} rx={10} />
      <Text lines={lines} size={size} fill="var(--ink)" weight={600} />
    </g>
  );
}

function Highlight({ p }: { p: Props }) {
  const { time, reducedMotion } = useContext(VisualContext);
  const w = num(p, 'w', 120);
  const h = num(p, 'h', 60);
  const pulse = reducedMotion ? 0 : (Math.sin(time * 5) + 1) / 2;
  return (
    <rect x={-w / 2 - pulse * 4} y={-h / 2 - pulse * 4} width={w + pulse * 8} height={h + pulse * 8} rx={16}
      fill="none" stroke={color(str(p, 'color', 'accent'))} strokeWidth={4} strokeDasharray={bool(p, 'dashed', false) ? '10 8' : undefined} />
  );
}

/* ---------------- workflow, regulation & QC graphics ---------------- */

function Building({ p }: { p: Props }) {
  const w = num(p, 'w', 200);
  const h = num(p, 'h', 150);
  const hl = num(p, 'highlight', 0);
  const sign = str(p, 'sign', 'LAB');
  return (
    <g>
      {hl > 0 && <rect x={-w / 2 - 14} y={-h - 52} width={w + 28} height={h + 66} rx={20} fill="none" stroke="var(--accent)" strokeWidth={4} opacity={hl} />}
      <path d={`M${-w / 2 - 12},${-h + 8} L0,${-h - 40} L${w / 2 + 12},${-h + 8} Z`} fill="var(--device-dark)" stroke="var(--line)" strokeWidth={2} strokeLinejoin="round" />
      <rect x={-w / 2} y={-h} width={w} height={h} rx={6} fill="var(--device)" stroke="var(--line)" strokeWidth={2} />
      <rect x={-w / 2 + 18} y={-h + 24} width={w * 0.24} height={h * 0.26} rx={4} fill="var(--glass-fill)" stroke="var(--glass)" />
      <rect x={w / 2 - 18 - w * 0.24} y={-h + 24} width={w * 0.24} height={h * 0.26} rx={4} fill="var(--glass-fill)" stroke="var(--glass)" />
      <rect x={-w * 0.12} y={-h * 0.42} width={w * 0.24} height={h * 0.42} rx={4} fill="var(--stage-card)" stroke="var(--line)" />
      <rect x={-w * 0.3} y={-h - 30} width={w * 0.6} height={24} rx={6} fill="var(--btn)" />
      <g transform={`translate(0,${-h - 18})`}><Text lines={[sign]} size={14} fill="var(--btn-ink)" weight={800} /></g>
      {str(p, 'label', '') && <g transform="translate(0,22)"><Text lines={wrap(str(p, 'label', ''), 26)} size={15} fill="var(--ink)" weight={700} /></g>}
    </g>
  );
}

function DocumentCard({ p }: { p: Props }) {
  const w = num(p, 'w', 170);
  const h = num(p, 'h', 120);
  const stamp = clamp(num(p, 'stamp', 0));
  const title = str(p, 'title', 'CERTIFICATE');
  const sub = str(p, 'sub', '');
  const stampText = str(p, 'stampText', '');
  const hl = num(p, 'highlight', 0);
  return (
    <g>
      {hl > 0 && <rect x={-w / 2 - 10} y={-h / 2 - 10} width={w + 20} height={h + 20} rx={14} fill="none" stroke="var(--accent)" strokeWidth={4} opacity={hl} />}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={8} fill={TONE_BG[str(p, 'tone', 'neutral')] ?? 'var(--stage-card)'} stroke="var(--line)" strokeWidth={2} />
      <rect x={-w / 2 + 8} y={-h / 2 + 8} width={w - 16} height={h - 16} rx={5} fill="none" stroke="var(--line)" strokeDasharray="4 4" />
      <g transform={`translate(0,${-h / 2 + 26})`}><Text lines={wrap(title, Math.floor(w / 9))} size={14} fill="var(--ink)" weight={800} /></g>
      {sub && <g transform={`translate(0,${-h / 2 + 52 + (wrap(title, Math.floor(w / 9)).length - 1) * 9})`}><Text lines={wrap(sub, Math.floor(w / 7.5))} size={12} fill="var(--muted)" weight={600} /></g>}
      {stampText && stamp > 0 && (
        <g transform={`translate(${w / 2 - 34},${h / 2 - 28}) rotate(-14) scale(${1.6 - stamp * 0.6})`} opacity={stamp}>
          <circle r={24} fill="none" stroke="var(--good)" strokeWidth={3} />
          <Text lines={wrap(stampText, 8)} size={10} fill="var(--good)" weight={900} />
        </g>
      )}
    </g>
  );
}

function Token({ p }: { p: Props }) {
  const label = str(p, 'label', '');
  const w = num(p, 'w', 150);
  const lines = wrap(label, num(p, 'wrap', Math.max(16, Math.floor(w / 8.5))));
  const h = Math.max(36, lines.length * 17 + 16);
  const hl = num(p, 'highlight', 0);
  return (
    <g>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2 > 22 ? 14 : h / 2} fill={TONE_BG[str(p, 'tone', 'neutral')] ?? 'var(--stage-card)'}
        stroke={hl > 0.5 ? 'var(--accent)' : 'var(--line)'} strokeWidth={hl > 0.5 ? 3 : 1.5} />
      <Text lines={lines} size={14} fill="var(--ink)" weight={700} />
    </g>
  );
}

function Bin({ p }: { p: Props }) {
  const w = num(p, 'w', 180);
  const h = num(p, 'h', 150);
  const hl = num(p, 'highlight', 0);
  return (
    <g>
      <path d={`M${-w / 2},${-h / 2} L${-w / 2 + 14},${h / 2} L${w / 2 - 14},${h / 2} L${w / 2},${-h / 2}`} fill={TONE_BG[str(p, 'tone', 'neutral')] ?? 'var(--stage-card)'}
        stroke={hl > 0.5 ? 'var(--accent)' : 'var(--line)'} strokeWidth={hl > 0.5 ? 4 : 2} strokeLinejoin="round" />
      <line x1={-w / 2 - 6} y1={-h / 2} x2={w / 2 + 6} y2={-h / 2} stroke="var(--line)" strokeWidth={4} strokeLinecap="round" />
      <g transform={`translate(0,${h / 2 + 22})`}><Text lines={wrap(str(p, 'label', ''), Math.floor(w / 8))} size={16} fill="var(--ink)" weight={800} /></g>
      {str(p, 'sub', '') && <g transform={`translate(0,${h / 2 + 46})`}><Text lines={wrap(str(p, 'sub', ''), Math.floor(w / 7))} size={12} fill="var(--muted)" weight={600} /></g>}
    </g>
  );
}

const ICONS: Record<string, (c: string) => ReactNode> = {
  gavel: (c) => (<g><rect x={-26} y={-30} width={40} height={20} rx={5} transform="rotate(-35)" fill={c} /><rect x={-4} y={-6} width={8} height={46} rx={4} transform="rotate(-35)" fill={c} /><rect x={-30} y={30} width={56} height={10} rx={4} fill={c} opacity={0.6} /></g>),
  trophy: (c) => (<g><path d="M-22,-30 L22,-30 L18,0 Q0,16 -18,0 Z" fill={c} /><path d="M-22,-24 Q-38,-22 -32,-6 Q-28,2 -18,0" fill="none" stroke={c} strokeWidth={5} /><path d="M22,-24 Q38,-22 32,-6 Q28,2 18,0" fill="none" stroke={c} strokeWidth={5} /><rect x={-5} y={8} width={10} height={16} fill={c} /><rect x={-18} y={24} width={36} height={9} rx={3} fill={c} /></g>),
  shield: (c) => (<path d="M0,-34 L28,-24 Q28,16 0,34 Q-28,16 -28,-24 Z" fill={c} />),
  magnifier: (c) => (<g><circle cx={-6} cy={-6} r={20} fill="none" stroke={c} strokeWidth={7} /><line x1={9} y1={9} x2={28} y2={28} stroke={c} strokeWidth={9} strokeLinecap="round" /></g>),
  check: (c) => (<path d="M-24,0 L-8,16 L26,-20" fill="none" stroke={c} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />),
  cross: (c) => (<g stroke={c} strokeWidth={9} strokeLinecap="round"><line x1={-20} y1={-20} x2={20} y2={20} /><line x1={20} y1={-20} x2={-20} y2={20} /></g>),
  flask: (c) => (<g><path d="M-8,-32 L8,-32 L8,-10 L26,26 Q28,32 22,32 L-22,32 Q-28,32 -26,26 L-8,-10 Z" fill="none" stroke={c} strokeWidth={5} strokeLinejoin="round" /><path d="M-17,12 L17,12 L24,28 L-24,28 Z" fill={c} opacity={0.6} /></g>),
  book: (c) => (<g><rect x={-26} y={-30} width={52} height={60} rx={5} fill={c} /><rect x={-18} y={-22} width={36} height={8} rx={2} fill="var(--stage-card)" /><rect x={-18} y={-8} width={26} height={5} rx={2} fill="var(--stage-card)" /></g>),
  flame: (c) => (<g><path d="M0,-34 Q22,-8 16,12 Q12,30 0,32 Q-12,30 -16,12 Q-20,-6 -4,-18 Q-4,-2 4,2 Q8,-14 0,-34 Z" fill={c} /><path d="M0,4 Q10,14 6,24 Q0,30 -6,24 Q-8,14 0,4 Z" fill="var(--stage-card)" opacity={0.7} /></g>),
  bell: (c) => (<g><path d="M-22,14 Q-22,-26 0,-28 Q22,-26 22,14 L28,22 L-28,22 Z" fill={c} /><circle cy={30} r={7} fill={c} /><rect x={-4} y={-36} width={8} height={9} rx={3} fill={c} /></g>),
  door: (c) => (<g><rect x={-22} y={-34} width={44} height={68} rx={4} fill="none" stroke={c} strokeWidth={6} /><rect x={-16} y={-28} width={32} height={56} fill={c} opacity={0.35} /><circle cx={10} cy={2} r={4} fill={c} /></g>),
  person: (c) => (<g fill={c}><circle cy={-16} r={14} /><path d="M-26,32 Q-26,4 0,4 Q26,4 26,32 Z" /></g>),
};

function Icon({ p }: { p: Props }) {
  const draw = ICONS[str(p, 'glyph', 'check')] ?? ICONS.check;
  const label = str(p, 'label', '');
  return (
    <g>
      {bool(p, 'disc', true) && <circle r={46} fill="var(--stage-card)" stroke="var(--line)" strokeWidth={2} />}
      {draw(color(str(p, 'color', 'accent')))}
      {label && (() => {
        const lines = wrap(label, 18);
        return <g transform={`translate(0,${64 + ((lines.length - 1) * 15 * 1.25) / 2})`}><Text lines={lines} size={15} fill="var(--ink)" weight={700} /></g>;
      })()}
    </g>
  );
}

/* ---------------- proteins & devices ---------------- */

/** One protein: fold 0 = normal curly (α-helix rich), 1 = flat misfolded sheet (β-sheet rich). */
function ProteinShape({ fold, size }: { fold: number; size: number }) {
  const f = clamp(fold);
  const coil = (dy: number) => {
    let d = `M${-size * 0.6},${dy}`;
    for (let i = 0; i <= 12; i++) {
      const x = -size * 0.6 + (i / 12) * size * 1.2;
      const y = dy + Math.sin(i * 1.4) * size * 0.16 * (1 - f);
      d += ` L${x},${y}`;
    }
    return d;
  };
  const good = 'var(--good)';
  const bad = 'var(--bad)';
  return (
    <g>
      <ellipse rx={size * (0.85 + f * 0.25)} ry={size * (0.6 - f * 0.22)} fill="var(--stage-card)" stroke={f > 0.5 ? bad : good} strokeWidth={2.5} />
      {[-0.25, 0, 0.25].map((k, i) => (
        <path key={i} d={coil(k * size * (1 - f * 0.3))} fill="none" stroke={f > 0.5 ? bad : good} strokeWidth={size * 0.09} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {f > 0.5 && [-0.25, 0, 0.25].map((k, i) => (
        <path key={`a${i}`} d={`M${size * 0.5},${k * size * 0.7 - size * 0.08} L${size * 0.66},${k * size * 0.7} L${size * 0.5},${k * size * 0.7 + size * 0.08}`} fill="none" stroke={bad} strokeWidth={size * 0.07} opacity={(f - 0.5) * 2} />
      ))}
      <circle cx={-size * 0.25} cy={-size * 0.42 + f * size * 0.12} r={size * 0.06} fill="var(--face)" />
      <circle cx={size * 0.1} cy={-size * 0.42 + f * size * 0.12} r={size * 0.06} fill="var(--face)" />
    </g>
  );
}

function Prion({ p }: { p: Props }) {
  const size = num(p, 'size', 40);
  const fold = num(p, 'fold', 0);
  const stack = Math.round(num(p, 'stack', 1));
  const hl = num(p, 'highlight', 0);
  const label = str(p, 'label', '');
  const lines = wrap(label, 18);
  return (
    <g>
      {hl > 0 && <circle r={size * 1.5} fill="none" stroke="var(--accent)" strokeWidth={4} opacity={hl} />}
      {Array.from({ length: stack }, (_, i) => (
        <g key={i} transform={`translate(${(i - (stack - 1) / 2) * size * 0.95},${i % 2 ? size * 0.12 : -size * 0.12})`}>
          <ProteinShape fold={fold} size={size} />
        </g>
      ))}
      {label && <g transform={`translate(0,${size + 22 + ((lines.length - 1) * 15 * 1.25) / 2})`}><Text lines={lines} size={15} fill="var(--ink)" weight={700} /></g>}
    </g>
  );
}

function Autoclave({ p }: { p: Props }) {
  const heat = clamp(num(p, 'heat', 0));
  const temp = str(p, 'temp', '');
  const label = str(p, 'label', 'Autoclave');
  return (
    <g>
      <rect x={-100} y={-80} width={200} height={160} rx={18} fill="var(--device)" stroke={heat > 0.05 ? 'var(--bad)' : 'var(--line)'} strokeWidth={2 + heat * 4} />
      <circle cx={-20} cy={0} r={52} fill="var(--device-dark)" stroke="var(--line)" strokeWidth={3} />
      <circle cx={-20} cy={0} r={40} fill="var(--bad)" opacity={heat * 0.35} />
      <rect x={44} y={-50} width={44} height={26} rx={5} fill="var(--stage-card)" stroke="var(--line)" />
      <g transform="translate(66,-37)"><Text lines={[temp]} size={11} fill="var(--ink)" weight={800} /></g>
      <rect x={52} y={0} width={28} height={8} rx={4} fill="var(--line)" />
      <rect x={52} y={16} width={28} height={8} rx={4} fill="var(--line)" />
      <g transform="translate(0,104)"><Text lines={[label]} size={15} fill="var(--ink)" weight={700} /></g>
    </g>
  );
}

/* ---------------- statistics ---------------- */

/** Normal curve with optional spec limits at ±limit SD and a mean shift (in SD). Tails beyond limits are shaded. */
/**
 * Schematic peripheral-smear field (not real morphology). Every property animates:
 * count = cells in the field (RBC count), size = relative cell size (MCV, 1 = normal),
 * pallor = central-pallor fraction of the radius (hypochromia, normal ≈ 0.33),
 * aniso = size variation (RDW, 0 = uniform), target = fraction of target cells.
 */
function Smear({ p, id }: { p: Props; id: string }) {
  const w = num(p, 'w', 320);
  const h = num(p, 'h', 220);
  const count = Math.round(clamp(num(p, 'count', 24), 0, 80));
  const size = num(p, 'size', 1);
  const pallor = clamp(num(p, 'pallor', 0.33), 0, 0.85);
  const aniso = clamp(num(p, 'aniso', 0));
  const target = clamp(num(p, 'target', 0));
  const label = str(p, 'label', '');
  const base = 15;
  const rnd = rand(num(p, 'seed', 11));
  // Jittered grid so cells rarely overlap and positions stay stable while props animate.
  const cols = 10;
  const rows = 8;
  const slots = Array.from({ length: cols * rows }, (_, i) => ({
    x: -w / 2 + (w / cols) * ((i % cols) + 0.5) + (rnd() - 0.5) * (w / cols) * 0.35,
    y: -h / 2 + (h / rows) * (Math.floor(i / cols) + 0.5) + (rnd() - 0.5) * (h / rows) * 0.35,
    k: rnd(),
    t: rnd(),
  }));
  const order = shuffleStable(slots.length, 5);
  const clipId = `smear-${id}`;
  return (
    <g>
      <defs><clipPath id={clipId}><rect x={-w / 2} y={-h / 2} width={w} height={h} rx={16} /></clipPath></defs>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={16} fill="var(--smear-bg)" stroke="var(--line)" strokeWidth={2} />
      <g clipPath={`url(#${clipId})`}>
        {order.slice(0, count).map((si) => {
          const s = slots[si];
          const r = base * size * (1 + aniso * (s.k - 0.5) * 1.1);
          const isTarget = s.t < target;
          // Keep every cell fully inside the field.
          const x = clamp(s.x, -w / 2 + r + 3, w / 2 - r - 3);
          const y = clamp(s.y, -h / 2 + r + 3, h / 2 - r - 3);
          return (
            <g key={si} transform={`translate(${x},${y})`}>
              <circle r={r} fill="var(--rbc)" stroke="var(--rbc-edge)" strokeWidth={1.2} />
              <circle r={r * (isTarget ? Math.max(pallor, 0.55) : pallor)} fill="var(--rbc-pallor)" opacity={0.9} />
              {isTarget && <circle r={r * 0.22} fill="var(--rbc)" />}
            </g>
          );
        })}
      </g>
      {label && <g transform={`translate(0,${h / 2 + 22})`}><Text lines={wrap(label, Math.floor(w / 8))} size={15} fill="var(--ink)" weight={700} /></g>}
    </g>
  );
}

function shuffleStable(n: number, seed: number) {
  const rnd = rand(seed);
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function BellCurve({ p, id }: { p: Props; id: string }) {
  const w = num(p, 'w', 520);
  const h = num(p, 'h', 220);
  const range = num(p, 'range', 7); // ± SD shown on the axis
  const limit = num(p, 'limit', 3);
  const shift = num(p, 'shift', 0);
  const showLimits = bool(p, 'limits', true);
  const sx = (z: number) => (z / range) * (w / 2);
  const pdf = (z: number) => Math.exp(-0.5 * (z - shift) * (z - shift));
  const pts: string[] = [];
  for (let i = 0; i <= 200; i++) {
    const z = -range + (i / 200) * 2 * range;
    pts.push(`${sx(z)},${-pdf(z) * h}`);
  }
  const area = (from: number, to: number) => {
    const a: string[] = [`M${sx(from)},0`];
    for (let i = 0; i <= 60; i++) {
      const z = from + (i / 60) * (to - from);
      a.push(`L${sx(z)},${-pdf(z) * h}`);
    }
    a.push(`L${sx(to)},0 Z`);
    return a.join(' ');
  };
  const tail = clamp(num(p, 'tailBoost', 0), 0, 1);
  const clipId = `bell-${id}`;
  return (
    <g>
      <defs><clipPath id={clipId}><rect x={-w / 2} y={-h - 10} width={w} height={h + 10} /></clipPath></defs>
      <line x1={-w / 2} y1={0} x2={w / 2} y2={0} stroke="var(--line)" strokeWidth={2} />
      <g clipPath={`url(#${clipId})`}>
        <path d={area(-range, range)} fill="var(--tone-b)" />
        {showLimits && <path d={area(limit, range)} fill="var(--bad)" opacity={0.55 + tail * 0.4} />}
        {showLimits && <path d={area(-range, -limit)} fill="var(--bad)" opacity={0.55 + tail * 0.4} />}
        <polyline points={pts.join(' ')} fill="none" stroke="var(--ag-b)" strokeWidth={3} />
      </g>
      <line x1={sx(shift)} y1={0} x2={sx(shift)} y2={-h - 6} stroke="var(--ag-b)" strokeWidth={1.5} strokeDasharray="5 5" />
      {showLimits && [-limit, limit].map((z) => (
        <g key={z}>
          <line x1={sx(z)} y1={8} x2={sx(z)} y2={-h - 6} stroke="var(--bad)" strokeWidth={3} />
          <g transform={`translate(${sx(z)},24)`}><Text lines={[`${z > 0 ? '+' : '−'}${Math.abs(Math.round(limit * 10) / 10)} SD`]} size={13} fill="var(--bad)" weight={800} /></g>
        </g>
      ))}
      {str(p, 'label', '') && <g transform={`translate(0,${-h - 26})`}><Text lines={[str(p, 'label', '')]} size={16} fill="var(--ink)" weight={800} /></g>}
      {str(p, 'caption', '') && <g transform="translate(0,50)"><Text lines={wrap(str(p, 'caption', ''), 60)} size={14} fill="var(--muted)" weight={700} /></g>}
    </g>
  );
}

/**
 * Schematic bacteria under the microscope: Gram-positive (purple) or Gram-negative (pink) cocci
 * in clusters, chains or pairs. Optional drop of reagent: `fizz` (0–1) shows oxygen bubbles
 * (catalase), `clump` (0–1) pulls cells into clumps (slide coagulase / clumping factor).
 */
function Cocci({ p }: { p: Props }) {
  const { time, reducedMotion } = useContext(VisualContext);
  const arrangement = str(p, 'arrangement', 'cluster');
  const gram = str(p, 'gram', 'pos');
  const n = Math.round(clamp(num(p, 'count', 14), 1, 40));
  const r = num(p, 'r', 11);
  const fizz = clamp(num(p, 'fizz', 0));
  const clump = clamp(num(p, 'clump', 0));
  const drop = bool(p, 'drop', false);
  const dw = num(p, 'w', 240);
  const dh = num(p, 'h', 150);
  const label = str(p, 'label', '');
  const rnd = rand(num(p, 'seed', 7));
  const fill = gram === 'neg' ? 'var(--gram-neg)' : 'var(--gram-pos)';
  let pts: [number, number][] = [];
  if (arrangement === 'chain') {
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * r * 1.9;
      pts.push([x, Math.sin(i * 0.7) * r * 1.4]);
    }
  } else if (arrangement === 'pair') {
    const pairs = Math.max(1, Math.round(n / 2));
    for (let i = 0; i < pairs; i++) {
      const cx = (rnd() - 0.5) * dw * 0.7;
      const cy = (rnd() - 0.5) * dh * 0.6;
      pts.push([cx - r * 0.95, cy], [cx + r * 0.95, cy]);
    }
  } else if (arrangement === 'scatter') {
    for (let i = 0; i < n; i++) pts.push([(rnd() - 0.5) * dw * 0.8, (rnd() - 0.5) * dh * 0.7]);
  } else {
    pts = hexCluster(n, r * 1.85).map(([x, y]) => [x + (rnd() - 0.5) * r * 0.5, y + (rnd() - 0.5) * r * 0.5]);
  }
  // Clumping pulls each cell toward one of three clump centres.
  const centres: [number, number][] = [[-dw * 0.27, -dh * 0.06], [dw * 0.25, -dh * 0.1], [0, dh * 0.2]];
  const cells = pts.map(([x, y], i) => {
    const [cx, cy] = centres[i % 3];
    const k = i / 3;
    const tx = cx + Math.cos(k * 2.4) * r * 1.15 * Math.sqrt(k);
    const ty = cy + Math.sin(k * 2.4) * r * 1.15 * Math.sqrt(k);
    return [x + (tx - x) * clump, y + (ty - y) * clump] as [number, number];
  });
  const bubbles = Math.round(fizz * 18);
  const bt = reducedMotion ? 0 : time;
  return (
    <g>
      {drop && <ellipse rx={dw / 2} ry={dh / 2} fill="var(--peroxide)" stroke="var(--line)" strokeWidth={2} />}
      {cells.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={fill} stroke="var(--ink)" strokeOpacity={0.35} strokeWidth={1.2} />
      ))}
      {Array.from({ length: bubbles }, (_, i) => {
        const phase = ((bt * 0.5 + i * 0.37) % 1);
        const br = 4 + (i % 4) * 2.5;
        const by = dh * 0.3 - phase * dh * 0.6;
        // Keep bubbles inside the drop: the ellipse narrows toward its top and bottom.
        const half = (dw / 2) * Math.sqrt(Math.max(0, 1 - (by / (dh / 2)) ** 2)) - br - 4;
        const bx = ((i * 0.618) % 1 - 0.5) * 2 * Math.max(0, half);
        return <circle key={`b${i}`} cx={bx} cy={by} r={br} fill="none" stroke="var(--ink)" strokeWidth={1.6} opacity={0.75 * (1 - phase * 0.6)} />;
      })}
      {label && <g transform={`translate(0,${(drop ? dh / 2 : r * 4) + 24})`}><Text lines={wrap(label, Math.max(16, Math.floor(dw / 8)))} size={15} fill="var(--ink)" weight={700} /></g>}
    </g>
  );
}

type Renderer = (args: { p: Props; id: string }) => ReactNode;

export const VISUALS: Record<VisualType, Renderer> = {
  rbc: Rbc,
  antibody: Antibody,
  cellField: CellField,
  tube: Tube,
  dropper: Dropper,
  centrifuge: Centrifuge,
  gradeScale: GradeScale,
  table: Table,
  label: Label,
  arrow: Arrow,
  card: Card,
  mascot: Mascot,
  specimen: Specimen,
  highlight: Highlight,
  bubble: Bubble,
  building: Building,
  document: DocumentCard,
  token: Token,
  bin: Bin,
  icon: Icon,
  prion: Prion,
  autoclave: Autoclave,
  bellCurve: BellCurve,
  smear: Smear,
  cocci: Cocci,
};

/** Positions any visual using the shared transform props. */
export function VisualNode({ type, p, id }: { type: VisualType; p: Props; id: string }) {
  const R = VISUALS[type];
  const opacity = num(p, 'opacity', 1);
  if (opacity <= 0.001 || !R) return null;
  const x = num(p, 'x', 0);
  const y = num(p, 'y', 0);
  const s = num(p, 'scale', 1);
  const rot = num(p, 'rotate', 0);
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`} opacity={opacity} data-visual={type} data-id={id}>
      <R p={p} id={id} />
    </g>
  );
}
