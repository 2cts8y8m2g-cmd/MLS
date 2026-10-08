# Continuation plan

## State at hand-off (2026-10-07)

- **Reviewer received and fully inventoried:** 79 chapters → 1,932 concepts. That breaks down as 79 core, 1,196 High-Yield Hits, 95 tables, 79 figures, 464 Exam Traps, 8 special sections, and 11 gap concepts the reviewer doesn't cover.
- **Lessons complete: 34, teaching 139 of 1,932 concepts (about 7.2%).** All 34 still require review: each has pending claims, and none has had human expert review.
  - Ch. 1 (23/23 concepts): `ops-clia-complexity-accreditation`, `ops-prion-decontamination`, `ops-record-specimen-retention`, `ops-lab-safety-precautions-osha`, `ops-reimbursement-drg-payment-window`, `ops-lab-design-hazcom-numbers`.
  - Ch. 2 (23/23 concepts): `ops-workflow-before-technology`, `ops-six-sigma-vs-lean`, `ops-instrument-selection-uptime-batch`, `ops-consolidation-utilization-autoverification`.
  - Ch. 3 (24/24 concepts): `pre-order-of-draw-edta`, `pre-citrate-ratio-heparin`, `pre-tube-additives-fluoride-gel`, `pre-patient-id-wbit`, `pre-csf-tubes-synovial-crystals`, `pre-biotin-daratumumab-interference`, `pre-allen-test-urine-timing`, `pre-specimen-numbers-rcf-24h-urine`.
  - Ch. 15 (3/26 concepts): `chem-fena-prerenal-vs-atn`.
  - Ch. 17 (6/22 concepts): `chem-diabetes-diagnosis-hba1c`.
  - Ch. 20 (4/22 concepts): `chem-serum-protein-electrophoresis-m-spike`.
  - Ch. 22 (3/26 concepts): `chem-hepatitis-b-serology-window`.
  - Ch. 31 (4/28 concepts): `heme-red-cell-indices-high-mchc`.
  - Ch. 33 (6/27 concepts): `heme-microcytic-anemia-ferritin-mentzer`.
  - Ch. 36 (5/29 concepts): `heme-mixing-study-pt-aptt`.
  - Ch. 37 (4/24 concepts): `heme-glanzmann-bernard-soulier`.
  - Ch. 40 (4/36 concepts): `ih-abo-forward-reverse`, `ih-abo-discrepancy-types-workup`.
  - Ch. 41 (4/35 concepts): `bb-acute-hemolytic-reaction-abo-compatibility`.
  - Ch. 42 (9/29 concepts): `ih-plasma-exchange-tpe`.
  - Ch. 57 (8/57 concepts): `micro-gpc-catalase-coagulase-mrsa`.
  - Ch. 60 (4/25 concepts): `micro-dimorphic-fungi`.
  - Ch. 64 (2/24 concepts): `micro-respiratory-virus-naat-antigen-culture`.
  - Ch. 66 (3/54 concepts): `micro-blood-culture-volume-contamination`.
- **Reviewer accuracy register:** 39 flags (22 verified issues, 17 needing verification), plus scan results.
- **Checks:** 270 unit tests and 99 browser checks pass (`npm test`, `npm run build && npm run e2e`).

## Regenerating the inventory

The EPUB and its full-text extraction live in `source/`, which is git-ignored because the book is copyrighted. To rebuild:

```bash
mkdir -p source/epub && cd source/epub && unzip -o ../reviewer.epub && cd ../..
python3 scripts/reviewer/extract_epub.py source/epub/OEBPS source/reviewer-extract.json
python3 scripts/reviewer/build_curriculum.py source/reviewer-extract.json
npm run validate && npm test && npm run coverage:report
```

Prerequisite overrides and cross-chapter links are in `build_curriculum.py` (`OVERRIDES`, `CROSS`). Edit them there, not in `curriculum.json`, which is generated.

## Next lessons: heaviest exam areas first (user decision, 2026-10-07)

Rotate through the four ≈20%-weight areas, one lesson at a time, starting each chapter with its core concept (Hit 1). Within an area, take chapters with the most simulator questions first:

| Round | Hematology (p4-heme) | Chemistry (p2-chem) | Microbiology (p7-micro) | Blood Bank (p5-bb) |
|---|---|---|---|---|
| 1 | Ch. 33 Anemias | Ch. 17 Glucose | Ch. 57 Bacteria | Ch. 41 Transfusion |
| 2 | Ch. 31 Blood & marrow basics | Ch. 15 Kidney, electrolytes, acid–base | Ch. 66 Micro specimens | Ch. 40 Blood groups (continue) |
| 3 | Ch. 36 Coag cascade | Ch. 22 Liver | Ch. 64 Viruses | Ch. 42 Apheresis & collection |
| 4 | Ch. 37 Platelets & VWD | Ch. 20 Proteins | Ch. 60 Fungi | Ch. 43 Stem cells & tissue |

Round 1 is done (Ch. 33, 17, 57, 41 each have their core lesson). Round 2 is done (Ch. 31, 15, 66, 40). Rounds 1–3 are done. Round 4: Ch. 37, 20 and 60 done; **next is Ch. 43 (Stem cells & tissue)**. Ch. 41 Hit 4 (TRALI vs TACO; NHSN v3.0 has definitions) is a natural follow-up.

Then continue by simulator-question count. Ops chapters 4–14 and other areas follow after the four heavy areas have their core concepts.

## Earlier plan: reviewer order

Work chapter by chapter. Each chapter's **core concept (Hit 1)** comes first, then clusters of related Hits, Traps and table rows.

1. **Ch. 1:** all concepts taught. Still pending in its lessons: design/HVAC/exit targets (`rv-two-exits`), sharps figures (`rv-sharps-2014`), the dated licensure count (`rv-licensure-count`), workforce figures, and the items listed in each lesson's claims.
2. **Ch. 2:** all concepts taught. Still pending in its lessons: the reviewer's numeric examples (10 s per tube, 4 vs 10 tests per sample, rerun example), the uptime contract rule, standardization, stockpiling, and test-cost figures.
3. **Ch. 3:** all concepts taught. Many Number Vault rows remain pending (see `pre-specimen-numbers-rcf-24h-urine` claims and flags `rv-heel-depth`, `rv-abg-cooling`).
4. **Ch. 4 core:** Beer's law. A good fit for a new `spectro` visual (light path, cuvette, absorbance vs concentration).
5. Continue through Ch. 5–14 (Part I), then Part II (Ch. 15–28), and so on. Ch. 40 still has 32 concepts (Hit 14 and Trap 6 are now taught).

The ordering is at the user's discretion. The heaviest-weighted exam areas are Chemistry, Hematology, Blood Bank and Microbiology.

**Per-lesson checklist**
1. Read the chapter in `source/reviewer-extract.json`.
2. Pick a concept cluster.
3. Verify each claim against an external source, and record it in `claims` with `refs`.
4. Check the cluster's absolute-wording and dated items, and log reviewer problems in `content/reviewer-review.json`.
5. Write original text, questions and mnemonics. Never copy reviewer passages or mnemonics into lessons. (The 828 simulator questions are imported separately into the Practice question bank, at the rights holder's request.)
6. Animate using the existing visual types, adding a type only when needed.
7. Run `npm run validate`, preview in **Author**, run `npm test`, then `npm run coverage:report`.
8. Capture frames to check the layout.

## User decisions (2026-10-07)

- The user holds the rights to the reviewer and asked for the **828-question Exam Simulator** to be imported. Done: `content/question-bank/reviewer-simulator.json`, shown on the Practice page as unverified reviewer content.
- Lesson order: **heaviest-weighted exam areas first** (Clinical Chemistry, Hematology, Blood Bank, Microbiology), core concepts (each chapter's Hit 1) before detail.

## Needed from the user

- ~~The 22 flagged items and 34-item review queue~~ — the user answered (2026-10-07) that these are not available.
- The three **mock-exam PDFs**, if wanted.
- The official ASCP guideline PDF and PRC Annex A, if the user can download them, since both were blocked from this environment.
- A qualified MLS educator for human review.

## Philippine MTLE gaps (not in the reviewer)

The gap domains `gap-histo` and `gap-ph-law` need another source: histopathologic and cytologic techniques, R.A. 5527, R.A. 4688 and DOH rules, and the PH code of ethics. `gap-ascp-edu` (education principles) covers an ASCP-only gap.
