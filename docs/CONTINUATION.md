# Continuation plan

Precise next steps for continuing MEMORY LAB in a later session. The order matters.

## State at hand-off (2026-10-07)

- The application is complete and working: player, engine, schema, validator, dashboard, curriculum browser, quiz, weak-area review, recommendations, bookmarks, saved progress, authoring and preview, and the coverage dashboard. It is verified by 53 unit tests and 78 browser checks (`npm test`, `npm run e2e`).
- **1 of 133 provisional concepts** has a complete lesson (`ih.abo.abo-forward-reverse`). That lesson **requires review**: 8 pending claims, 4 open flags, no expert review, and no reviewer mapping.
- **Reviewer: not received.** Nothing is mapped to chapters or pages.

## Step 1: Get the reviewer (blocking for source-based work)

1. Commit the reviewer to `source/` (for example `source/reviewer.pdf`). If it's large, give its location instead.
2. Extract the table of contents with `pdftotext -layout` (or OCR if scanned). Record every chapter in `content/reviewer.json` → `chapters[]` (`id`, `title`, `pages`, `status: "inventoried"`), set `received: true`, and set `pagesAccessible` to the pages actually readable. Never list pages that couldn't be read.
3. For each chapter, list its topics and concepts, **including those found only in tables, figures and explanatory notes**.
4. Reconcile with `content/curriculum.json`:
   - Concept in reviewer and inventory → set `reviewerRef: { chapter, pages }`.
   - Concept in reviewer only → add it (`reviewerRef` set).
   - Concept in inventory only → keep it, but note `"notes": "Not in reviewer"` so it isn't presented as reviewer content.
   - Then change `provenance.status` to `"reviewer-derived"` and update the statement.
   - Edit `scripts/build-provisional-curriculum.py` **or** stop using it. Once reviewer-derived, `curriculum.json` becomes the source of truth; don't regenerate over it.
5. Map the ABO lesson: set `reviewer.status: "mapped"`, `chapter` and `pages`. Fix anything the reviewer covers that the lesson lacks, or log disagreements in `docs/ACCURACY.md`.
6. Run `npm run validate && npm test && npm run coverage:report`.

## Step 2: Verify the exam outlines

- Download the current **MLS(ASCP)** and **MLS(ASCPi)** content guidelines from ascp.org. Update `content/tracks.json` areas and weights, and set `verified: true` with the date.
- Get **Annex A** of PRB-MT Res. 13 s. 2023 (the enhanced TOS). Update MTLE areas, confirm the sixth subject's current scope, and adjust domain-to-subject mapping and track tags on concepts.
- Then flag concepts that are track-specific (set `tracks` to one track) and subjects that are missing from the reviewer.

## Step 3: Close the ABO lesson's review items

Verify the 8 pending claims against the AABB Technical Manual or Harmening (record edition and pages, and set `consulted: true` only after reading). Resolve the 4 flags, and ask a qualified MLS educator to review. Record their name only with permission.

## Step 4: Expand chapter by chapter

Recommended order (this is the curriculum `sequence`; replace it with the reviewer's chapter order once known):
1. Immunology basics: `immuno.ag-ab.agglutination` and `immuno.basics.immunoglobulins` (prerequisites of the ABO lesson)
2. The rest of immunohematology: `ih.abo.abo-antigens-genetics`, `abo-discrepancies`, `bombay-subgroups`, `rh-d`, `dat-iat`, `antibody-id`, `crossmatch`, `hdfn`, `transfusion-reactions`
3. Hematology and hemostasis (high weight on both tracks)
4. Clinical chemistry
5. Microbiology (bacteriology, then mycology/virology, then parasitology)
6. Urinalysis and body fluids
7. QC, lab math and lab operations; molecular diagnostics
8. MTLE-only: histopathologic and cytologic techniques; laws and ethics

Per lesson: copy the ABO JSON as a pattern → write the 8 beats → animate with existing visual types → write 3+ original questions with rationales for every option → fill claims, refs and flags → `npm run validate` → preview in **Author** → `npm test` → `npm run coverage:report`.

Visual types likely needed next (add to `src/engine/visuals/index.tsx`): `cellLineage` (maturation stages for hematopoiesis), `pathway` (step-highlighted biochemical or coagulation cascade), `gel` (electrophoresis bands), `colony`/`plate` (culture media), `strip` (urine reagent pads), `smear` (schematic slide field), `chart` (Levey–Jennings). Real morphology (smears, parasites, crystals) needs licensed images with credit and license in `morphology.images`.

## Step 5: Optional improvements

- Recorded or cloud narration (add a per-cue `audio` URL; keep Web Speech as the fallback).
- Spaced-repetition scheduling on top of the weak-area data.
- Cloud sync of progress (currently browser-local with export and import).
