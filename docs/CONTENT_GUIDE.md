# Content guide: writing a MEMORY LAB lesson

Lessons are JSON files in `content/lessons/`, named `<lesson id>.json`. The TypeScript schema is in `src/schema/types.ts`, and the rules are in `src/schema/validate.ts`. Use **Author** in the app to edit and preview. Then run:

```bash
npm run validate         # structural errors + completeness checklist + review needs
npm run coverage:report  # refresh docs/COVERAGE.md
npm test                 # includes content integrity tests
```

## 1. Teaching contract (every lesson)

| # | Scene `kind` | Must show |
|---|---|---|
| 1 | `hook` | A visual question or short lab scenario |
| 2 | `normal` | The normal mechanism, step by step |
| 3 | `change` | The abnormal process, interference or diagnostic difference (or the principle or workflow, for topics with no disease link) |
| 4 | `lab` | Specimen → method → observation → interpretation |
| 5 | `exam` | Commonly confused concepts side by side, with the distinguishing feature |
| 6 | `memory` | An original mnemonic or analogy **and where it stops matching the science** |
| 7 | `check` | A prompt leading to the 3 questions (rendered below the player) |
| 8 | `takeaway` | One sentence |

Writing style: about a 5th-grade reading level, keeping correct terms and exam-level depth. Give the plain-language idea first, then name it ("We see clumps. That is *agglutination*."). Explain the mechanism; don't list facts. Write originally, and never copy textbook passages, question banks or figures.

`explanation` answers the five questions: `what`, `why`, `measure`, `differs`, `examAngle`.

## 2. Timing

- `scene.start` / `scene.end` and `cue.start` / `cue.end` are **absolute lesson seconds**. Scenes must be contiguous from 0 to `duration`.
- Keyframe `t` values are **seconds from the scene start**.
- Each cue (caption) should have at least one keyframe inside it, so the visuals change with the words. A unit test enforces this for the reference lesson.
- Plan for about 150 words per minute of caption text at 1×. When narration is on, the player waits at the end of a caption until speech finishes.

## 3. Animation model

Every visual object has `type`, `props` (initial values) and optional `keys`:

```json
{ "id": "cell", "type": "rbc", "props": { "x": 300, "y": 250, "antigen": "A", "opacity": 0 },
  "keys": [ { "t": 0, "opacity": 0 }, { "t": 1.5, "opacity": 1, "ease": "out" } ] }
```

- Numbers interpolate between keyframes that mention them. Strings and booleans switch at the keyframe.
- `ease` on the **destination** key: `linear`, `in`, `out`, `inOut` (default), or `step` (hold, then jump).
- Before the first key, the `props` value is shown.
- The stage is **960 × 540** (16:9). Shared props for all types: `x`, `y`, `scale`, `rotate`, `opacity`.
- Reduced-motion mode shows the settled end state of each caption, so make sure the state at each caption's end makes sense on its own.

## 4. Visual types

| Type | Key props (animatable numbers in *italics*) |
|---|---|
| `rbc` | `r`, `antigen` (`A`,`B`,`AB`,`O`=H only,`none`=Bombay), `antigens` (count), `face`, `mood` (`happy`/`neutral`/`worried`), *`highlight`*, `label`, `labelSize`, *`parasite`* (`ring`, `double`, `multi`, `applique`, `stippled`, `clefts`, `crescent`, `tetrad`), *`lysed`* (hide the red cell, as in a thick film) — **schematic** parasite marks, not real morphology |
| `antibody` | `spec` (`A`,`B`,`H`,`AB`), `cls` (`IgM` pentamer / `IgG`), *`size`*, *`spin`* (rotates the molecule, not its label), `label` |
| `cellField` | `w`, `h`, `count`, `cellR`, `antigen`, `spec`, `seed`, *`free`* (unbound antibodies), *`bound`* (bridging antibodies), *`clump`* (0 dispersed → 1 lattice), *`hemolysis`*, `label` |
| `tube` | `label`, `fluid` (`saline`/`plasma`/CSS color), *`level`*, *`cells`*, *`settle`* (button forms), *`shake`* (resuspension), *`grade`* (0–4 clump pattern), *`hemolysis`*, *`clot`* (0–1 gel clot), *`highlight`*, `result` (chip text), `cap` (stopper colour as a CSS colour, e.g. `#8ec9ee` for citrate) |
| `dropper` | `label`, `color`, *`drop`* (0→1 a drop falls), `dropDistance` |
| `centrifuge` | *`spin`* (degrees), `label` |
| `specimen` | `top` (`lavender`,`pink`,`red`,`gold`,`blue`,`green`,`gray`), *`separated`* (plasma layer), `label` |
| `gradeScale` | *`reveal`* (0–5), *`highlight`* (index), `descriptions[]` |
| `table` | `title`, `cols[]`, `rows[][]`, `cellW`, `cellH`, *`reveal`* (cells shown), *`highlightRow`* |
| `card` | `w`, `h`, `title`, `lines[]`, *`reveal`*, `tone` (`a`,`b`,`neutral`,`warn`,`good`,`bad`,`blood`), `size` |
| `label` | `text` (`\n` for line breaks), `size`, `weight`, `color` token, `align`, `bg`, `wrap` |
| `bubble` | `text`, `w`, `tail` (`left`/`right`/`down`), `tone`, `size` |
| `arrow` | `dx`, `dy`, *`draw`* (0→1), `color`, `label`, `dashed` |
| `highlight` | `w`, `h`, `color`, `dashed` (pulses unless reduced motion) |
| `mascot` | `expression` (`happy`/`curious`/`thinking`/`alert`) |
| `building` | `w`, `h`, `sign`, `label`, *`highlight`* |
| `document` | `w`, `h`, `title`, `sub`, `tone`, `stampText`, *`stamp`* (0→1 stamp lands), *`highlight`* |
| `smear` | `w`, `h`, *`count`* (cells in field ≈ RBC count), *`size`* (1 = normal MCV), *`pallor`* (central pallor, normal ≈ 0.33), *`aniso`* (size variation ≈ RDW), *`target`* (fraction of target cells), `seed`, `label` — a **schematic** smear field, not real morphology |
| `cocci` | *`arrangement`* (`cluster`, `chain`, `pair`, `scatter`), *`gram`* (`pos` purple / `neg` pink / `afb` carbolfuchsin red with beading / `blue` methylene-blue counterstain), *`shape`* (`coccus` or `rod`), *`count`*, *`r`*, *`drop`* (reagent drop of size `w`×`h`), *`fizz`* (0–1 oxygen bubbles, catalase), *`clump`* (0–1 cells pulled into clumps, slide coagulase), `seed`, `label` — **schematic** bacteria, not real Gram-stain morphology |
| `token` | `label`, `w`, `wrap` (default: about w ÷ 8.5 characters, min 16), `tone`, *`highlight`* — a chip that can be moved and sorted |
| `bin` | `w`, `h`, `label`, `sub`, `tone`, *`highlight`* — a category bucket |
| `prion` | *`fold`* (0 normal α-helical PrP^C → 1 misfolded β-sheet PrP^Sc), *`stack`* (copies in a fibril), *`size`*, *`highlight`*, `label` |
| `autoclave` | `temp` (display text), *`heat`* (0→1 glow), `label` |
| `bellCurve` | `w`, `h`, `range` (± SD on axis), *`limit`* (spec limits at ± SD), *`shift`* (mean shift in SD), `limits` (show), *`tailBoost`*, `label`, `caption` |
| `icon` | `glyph` (`gavel`,`trophy`,`shield`,`magnifier`,`check`,`cross`,`flask`,`book`,`person`,`flame`,`bell`,`door`), `color`, `disc`, `label` |

Color tokens: `ink`, `muted`, `accent`, `a`, `b`, `h`, `good`, `warn`, `bad`, `plasma`, `saline`, `blood`, `surface`. They follow light and dark mode automatically.

To add a visual type, add a renderer to `VISUALS` in `src/engine/visuals/index.tsx` and its name to `VISUAL_TYPES` in `src/schema/types.ts`.

**Schematic vs real morphology.** The player always shows a "Schematic · not to scale" badge. When real morphology matters (blood smears, parasites, crystals, casts), add properly licensed images to `morphology.images` with `credit` and `license`. Validation requires both, so never use images whose license you have not confirmed.

## 5. Questions

Three or more per lesson. Each has a `skill` tag, which weak-area review groups by. Give every option a `rationale`: say why the correct one is right and why each distractor is wrong. Lesson questions are always original items; do not adapt the reviewer's simulator questions into lessons.

**Question banks** (`content/question-bank/*.json`, type `QuestionBank`) are separate imported sources, shown on the Practice page. Each states its `source`, `permission` and `verification`. The reviewer's Exam Simulator is generated by `scripts/reviewer/import_simulator.py`; edit the keyword `FLAG_RULES` there (not the JSON) to attach accuracy-register notes to affected questions.

## 6. Evidence and accuracy

- `references[]`: only real sources. Set `consulted: true` **only** if you actually read the source for this lesson. Listing a standard textbook as `consulted: false` "for future verification" is fine.
- `claims[]`: the lesson's key scientific statements.
  - `checked`: must cite at least one consulted reference.
  - `pending`: believed correct but not yet verified in a consulted source.
  - `analogy`: a deliberate simplification such as cartoons or mnemonics.
- `accuracyFlags[]`: outdated information, contradictions, missing context, uncertainty, or method-, guideline- or reference-range-dependent findings.
- `verification.humanExpertReview` stays `false` unless a named, qualified person reviewed the lesson.
- `reviewer`: `status: "mapped"` with `locations: [{ chapter, section, items? }]`. Sections are the reviewer's headings ("High-Yield Hits", "Number Vault", "Exam Traps", "Figure", …), and items are 1-based. The EPUB has no page numbers.
- `conceptIds`: only the curriculum concepts the lesson **fully** teaches. Partly covered items are mentioned in `reviewer.note`, not counted.
- Cite the reviewer as a reference with `"kind": "reviewer"` and its `locations`. It documents scope, but it can never be the only support for a `checked` claim.
- Log problems you find in the reviewer in `content/reviewer-review.json` (`verified-issue` only with evidence).
