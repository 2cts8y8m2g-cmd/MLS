# Continuation plan

## State at hand-off (2026-10-07)

- **Reviewer received and fully inventoried:** 79 chapters → 1,932 concepts. That breaks down as 79 core, 1,196 High-Yield Hits, 95 tables, 79 figures, 464 Exam Traps, 8 special sections, and 11 gap concepts the reviewer doesn't cover.
- **Lessons complete: 13, teaching 56 of 1,932 concepts (about 2.9%).** All 13 still require review: each has pending claims, and none has had human expert review.
  - Ch. 1 (23/23 concepts): `ops-clia-complexity-accreditation`, `ops-prion-decontamination`, `ops-record-specimen-retention`, `ops-lab-safety-precautions-osha`, `ops-reimbursement-drg-payment-window`, `ops-lab-design-hazcom-numbers`.
  - Ch. 2 (23/23 concepts): `ops-workflow-before-technology`, `ops-six-sigma-vs-lean`, `ops-instrument-selection-uptime-batch`, `ops-consolidation-utilization-autoverification`.
  - Ch. 3 (8/24 concepts): `pre-order-of-draw-edta`, `pre-citrate-ratio-heparin`.
  - Ch. 40 (2/36 concepts): `ih-abo-forward-reverse`.
- **Reviewer accuracy register:** 22 flags (12 verified issues, 10 needing verification), plus scan results.
- **Checks:** 134 unit tests and 85 browser checks pass (`npm test`, `npm run build && npm run e2e`).

## Regenerating the inventory

The EPUB and its full-text extraction live in `source/`, which is git-ignored because the book is copyrighted. To rebuild:

```bash
mkdir -p source/epub && cd source/epub && unzip -o ../reviewer.epub && cd ../..
python3 scripts/reviewer/extract_epub.py source/epub/OEBPS source/reviewer-extract.json
python3 scripts/reviewer/build_curriculum.py source/reviewer-extract.json
npm run validate && npm test && npm run coverage:report
```

Prerequisite overrides and cross-chapter links are in `build_curriculum.py` (`OVERRIDES`, `CROSS`). Edit them there, not in `curriculum.json`, which is generated.

## Next lessons, in reviewer order

Work chapter by chapter. Each chapter's **core concept (Hit 1)** comes first, then clusters of related Hits, Traps and table rows.

1. **Ch. 1:** all concepts taught. Still pending in its lessons: design/HVAC/exit targets (`rv-two-exits`), sharps figures (`rv-sharps-2014`), the dated licensure count (`rv-licensure-count`), workforce figures, and the items listed in each lesson's claims.
2. **Ch. 2:** all concepts taught. Still pending in its lessons: the reviewer's numeric examples (10 s per tube, 4 vs 10 tests per sample, rerun example), the uptime contract rule, standardization, stockpiling, and test-cost figures.
3. **Ch. 3 (8/24 taught):** order of draw, citrate ratio and heparin done. Next clusters: tube chemistry — fluoride timing, clotting times, gel and TDM (Hits 7–9, Traps 3–4; WHO 2010 says fluoride preserves glucose up to five days vs the reviewer's three); patient ID and ordering errors (Hits 2–3); special specimens — CSF tubes, synovial crystals, Allen test, urine timing (Hits 10–12, 15, Traps 5–6); interferences — biotin (check the 2017 FDA communication for updates) and daratumumab (Hits 13–14); and the large Number Vault table (note: Sood 2010 says do not cool arterial blood-gas samples and analyze within 30 min, which conflicts with the table's "1–5 °C ice water" row).
4. **Ch. 4 core:** Beer's law. A good fit for a new `pathway` or `spectro` visual.
5. Continue through Ch. 5–14 (Part I), then Part II (Ch. 15–28), and so on. Ch. 40 still has 34 concepts; Hit 14 (discrepancy Groups I–IV) and Trap 6 are natural next ABO lessons.

The ordering is at the user's discretion. The heaviest-weighted exam areas are Chemistry, Hematology, Blood Bank and Microbiology.

**Per-lesson checklist**
1. Read the chapter in `source/reviewer-extract.json`.
2. Pick a concept cluster.
3. Verify each claim against an external source, and record it in `claims` with `refs`.
4. Check the cluster's absolute-wording and dated items, and log reviewer problems in `content/reviewer-review.json`.
5. Write original text, questions and mnemonics. Never copy reviewer passages, its 828 simulator questions, or its mnemonics.
6. Animate using the existing visual types, adding a type only when needed.
7. Run `npm run validate`, preview in **Author**, run `npm test`, then `npm run coverage:report`.
8. Capture frames to check the layout.

## Needed from the user

- The **22 flagged items and the 34-item human-review queue** named in the reviewer's release record.
- Whether the user holds the rights to the reviewer and wants its **828-question Exam Simulator** imported. It's currently not imported (treated as a proprietary question bank; only per-chapter counts are recorded). If yes, an importer can add it as a separate, clearly labeled question source.
- The three **mock-exam PDFs**, if wanted.
- The official ASCP guideline PDF and PRC Annex A, if the user can download them, since both were blocked from this environment.
- A qualified MLS educator for human review.

## Philippine MTLE gaps (not in the reviewer)

The gap domains `gap-histo` and `gap-ph-law` need another source: histopathologic and cytologic techniques, R.A. 5527, R.A. 4688 and DOH rules, and the PH code of ethics. `gap-ascp-edu` (education principles) covers an ASCP-only gap.
