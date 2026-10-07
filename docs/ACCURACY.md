# Accuracy log

What was checked, how, and what is still open. Lesson-level detail (claims, references, flags) lives in each lesson JSON and in the app under **Evidence & accuracy**. Reviewer-level findings live in `content/reviewer-review.json` and on the **Coverage** page.

**No human expert has reviewed any content.** Nothing here is endorsed by ASCP, the ASCP BOC, or the PRC.

## Policy

- The reviewer (*MEMORY LAB: The Memory-First Medical Laboratory Science Reviewer*, A. Almoradie, 1st ed. v2.0, 2026) is the **curriculum foundation**, not an authority.
- A claim is `checked` only if it cites at least one **external** source that was actually read. The validator rejects claims whose only support is the reviewer (`kind: "reviewer"`).
- The reviewer's own release record says it had **no independent human specialist review**. It reports 22 items flagged for human review and a 34-item review queue; neither is in the EPUB. Ask the author for them.

## External sources consulted

| Source | Used for |
|---|---|
| R.A. 5527, Sec. 15–19 (lawphil.net) | MTLE subjects and weights; passing rule as enacted |
| PRB-MT Res. No. 13, s. 2023 (prc.gov.ph) | Enhanced TOS adopted from Aug 2023 (Annex A not retrieved) |
| R.A. 4688 (lawphil.net) | PH clinical-laboratory registration, annual DOH license, physician in charge |
| 42 CFR 493.3, 493.5, 493.15, 493.551 (eCFR) | CLIA applicability and exclusions, complexity categories and certificates, waived tests, deemed status |
| CMS, *How to Obtain a CLIA Certificate*; CMS *List of Exempt States* v. 08/15/2025 | FDA categorization, stringency rises with complexity; WA (full) and NY (partial) exempt |
| Parastatidou et al. 2025; Shen et al. 2025; Shastry et al. 2013; Elzein 2024 (Europe PMC full text) | ABO antibody classes, naturally occurring antibodies, Bombay serology, leukemia-related discrepancies |
| ISBT RCIBGT Working Party annual report 2025–2026 | 48 blood group systems, 371 antigens |
| AABB Standards page | 35th edition effective April 1, 2026 |
| CLSI M100 product page | M100-Ed36, January 26, 2026 |
| Boitrelle et al., *Life* 2021;11:1368 | WHO semen manual 6th ed. (2021) lower 5th-centile limits |
| Haferlach et al., *Med Genet* 2024;36:3 | WHO-HAEM5 blast-threshold changes |

## Not accessible

- The official ASCP BOC MLS content guideline PDF (HTTP 403/404). ASCP weights remain unverified. The reviewer's Appendix A says 17–22% for the four major areas; one secondary source said 17–20% for Microbiology.
- Annex A of PRB-MT Res. 13 s. 2023 (HTTP 403).
- NCBI Bookshelf (CAPTCHA), the AABB Technical Manual, and Harmening (not available).
- The reviewer's three mock-exam PDFs (not provided).

## Reviewer accuracy register (summary)

There are 25 flags: 13 verified issues and 12 that still need verification. The full text, with evidence links, is in `content/reviewer-review.json`.

Verified:
- **Ch. 1 Trap 2:** exempt states given as "New York, D.C."; CMS lists Washington and New York.
- **Ch. 40 Vault #1:** "35 ISBT systems"; ISBT now lists 48 systems and 371 antigens.
- **Bibliography and Ch. 74:** AABB Standards 2019; the current edition is the 35th (2026).
- **Bibliography:** CLSI M100 2020; the current edition is Ed36 (2026). Ch. 58 breakpoints may be outdated.
- **Ch. 26:** WHO 2010 semen values; the WHO 6th edition (2021) revised them, and the reviewer's 2–5 mL volume doesn't match WHO 2010 either.
- **Ch. 35:** blast threshold ≥20% per WHO 2017; WHO-HAEM5 and the 2022 ICC differ.
- **Ch. 1 and 13:** US-only regulation with no PH equivalents (context gap for the MTLE track).

Needs verification:
- Ch. 1 Hit 4: breath tests "not regulated by CLIA".
- Ch. 40 Vault #2: ">62 Rh antigens".
- Ch. 31 core: "MCHC increased **only** in spherocytosis".
- Ch. 73: "4 FDA-approved Alzheimer drugs".
- Ch. 52: IUIS 2020 count.
- Ch. 40 Hit 2: "two ABO determinations" wording.
- Appendix A: the ASCP weights.

Automated scan: **23** dated-guideline statements and **134** High-Yield Hits with only/always/never wording. Each must be checked when its lesson is built.

## Open lesson issues

- **ABO Forward and Reverse Typing:** 10 pending claims. These cover infant antibody age and the reverse-typing cutoff, elderly patients, IgM binding sites, tube grading, hemolysis as positive, *Ulex*, rouleaux, A2 subgroups, two ABO determinations, and emergency-release components. There are also 4 open flags: tube-grading method dependence, the age cutoff, specimen type, and the discrepancy Groups I–IV that the lesson doesn't fully teach.
- **CLIA '88:** 3 pending claims (the accreditor list, the number of states licensing personnel, inspection of waived labs) and 3 open flags (US-only scope, generic test-complexity examples, breath tests).
