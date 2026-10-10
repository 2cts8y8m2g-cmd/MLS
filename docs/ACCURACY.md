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

There are 93 flags: 69 verified issues and 24 that still need verification. The full text, with evidence links, is in `content/reviewer-review.json`.

Verified:
- **Ch. 1 Trap 2:** exempt states given as "New York, D.C."; CMS lists Washington and New York.
- **Ch. 40 Vault #1:** "35 ISBT systems"; ISBT now lists 48 systems and 371 antigens.
- **Bibliography and Ch. 74:** AABB Standards 2019; the current edition is the 35th (2026).
- **Bibliography:** CLSI M100 2020; the current edition is Ed36 (2026). Ch. 58 breakpoints may be outdated.
- **Ch. 26:** WHO 2010 semen values; the WHO 6th edition (2021) revised them, and the reviewer's 2–5 mL volume doesn't match WHO 2010 either.
- **Ch. 35:** blast threshold ≥20% per WHO 2017; WHO-HAEM5 and the 2022 ICC differ.
- **Ch. 42 Hit 2:** TPE removal percentages (30% / 10% left) contradict its own e⁻ˣ formula (≈37% / 14%).
- **Ch. 22:** HBV chronicity "80% neonates, 1–2% adults" (CDC: ~90% infants, ~5% adults); IgM anti-HBc called the "sole" window marker (total anti-HBc and HBV DNA too).
- **Ch. 26 Hits 1–2:** fixed hCG discriminatory zone presented as diagnostic context (Bobdiwala 2017: varies, never diagnoses ectopic alone); “< 53% rise in 48 h = abnormal” (newer data: 35% minimum for a viable IUP).
- **Ch. 18 Trap 2:** direct LDL assay said to “stay valid even at TG 600” (HEART UK/ACB 2025: method-dependent, marked bias vs the reference method, not recommended in hypertriglyceridaemia).
- **Ch. 41 Hit 4:** BNP said to “NOT rise” in TRALI and TRALI treated with “oxygen only” (Vlaar 2019: natriuretic peptides are always raised in severe TRALI and critical illness; care is supportive, including ventilation).
- **Ch. 33 Hit 5:** osmotic fragility listed as an HS test without noting the conventional OFT is no longer recommended (Chueh 2022: flow-based OFT and EMA binding preferred).
- **Ch. 23 Hit 2:** acute pancreatitis defined as clinical features + enzymes > 3 × ULN (revised Atlanta: any two of pain, enzymes ≥ 3 × ULN, imaging).
- **Ch. 63 Trap 5:** granulocytic morulae equated with Anaplasma only (Biggs 2016: E. ewingii also infects granulocytes; smears need confirmation).
- **Ch. 41 Hit 5:** “< 8.0 g/dL in acute coronary syndrome” (MINT: restrictive 7–8 g/dL may increase MI or death in acute MI).
- **Ch. 41 Hit 7:** cryo trigger fibrinogen < 100 mg/dL and 150–250 mg/unit (current reviews: risk rises below ~200 mg/dL; AABB ≥ 150 mg/unit; triggers vary).
- **Ch. 36 Hit 5:** mild hemophilia given as 6–30% (standard: > 5–40 IU/dL).
- **Ch. 19 Hits 1, 3, 5:** built on the Fourth Universal Definition of MI; the Fifth (2026) requires sex-specific 99th percentile URLs and replaces numbered types with primary, secondary and procedure-related MI.
- **Ch. 58 Trap 5:** “aztreonam stays active” against MBL producers (Khan 2026: co-produced ESBL/AmpC often inactivate it).
- **Ch. 42 Hits 15–16:** 12.5 g/dL / 38% said to apply to all whole-blood donors (21 CFR 630.10: male allogeneic ≥ 13.0 g/dL / 39%); lower BP limits omitted.
- **Ch. 57 Hit 29:** Enterococcus called a “β-hemolytic streptococcus” (separate genus; β-hemolysis in only 20% of isolates, Fialho 2026). Confirm by 6.5% NaCl and bile esculin.
- **Ch. 37 Hit 3:** VWF activity/antigen and FVIII/antigen cut-off “0.6” (2021 ASH ISTH NHF WFH guideline, via Tosetto 2026: < 0.7, low certainty).
- **Ch. 15 Hit 3:** normal anion gap “≈ 12 (8–16)” (method-dependent: ion-selective electrodes ≈ 6 ± 3, Lee 2006; a 2025 review lists 4–12).
- **Ch. 66 Hit 4:** sputum rejected at > 10 SEC/LPF but “acceptable if < 25 epithelial cells” (self-contradictory; Dong 2026: < 10 SEC + > 25 leukocytes).
- **Ch. 41 Hit 14:** HBV “core window” said to be caught by NAT (Badawi 2025: anti-HBc may be the only marker there; NAT shortens the early window).
- **Ch. 29 Hit 1:** RBC casts “glomerular disease, full stop” (Gaggar 2024: RBC casts in 29% of biopsy-proven interstitial nephritis).
- **Ch. 29 Hit 5:** WBC casts tied to pyelonephritis and waxy casts to end-stage disease (Gaggar 2024: WBC casts also in interstitial nephritis and nephritic syndrome; waxy casts in acute and chronic renal failure).
- **Ch. 34 Hit 4:** PV “JAK2 V617F in essentially all cases” (> 95%; 3–5% carry exon 12–15 mutations — Palandri 2026, Testa 2026).
- **Ch. 34 Hit 5:** PMF median survival “~5 years” (Shao 2025: 9.2 years in a large series).
- **Ch. 38 Hits 3 and 9:** factor V Leiden fold-risks (homozygous “10–15×”, + OCPs “8–20×”) conflict with the reviewer’s own Ch. 72 simulator question (~80× homozygous) and with published figures (Khider 2022: ~10× homozygous; Nakashima & Rogers 2014: 80× homozygous, 30–60× with OCPs).
- **Ch. 20 Trap 2:** bisalbuminemia called a benign variant needing no work-up; Kapatia 2021 also describes a transient acquired form (high-dose β-lactams, pancreatic pseudocyst).
- **Ch. 60 Hit 9 / Trap 4:** piperacillin-tazobactam presented as a current cause of false-positive galactomannan (Vergidis 2014, abstract: 0 of 32 current US lots contained GM; now a rare cause).
- **Ch. 60 simulator Q786:** *A. niger* described as uniseriate (Samson 2007: biseriate).
- **Ch. 40 simulator Q372:** RhIG for a 60 mL bleed given as 2 vials; technical guidance (Hajjaj 2025) rounds and adds one vial (3).
- **Ch. 57 Hit 36:** HACEK called “culture-negative” (Khaledi 2022: ~99% detected within 5 days by automated blood culture; prolonged incubation of no value). Ch. 57 Hit 33 repeats the *A. niger* “uniseriate” error (rv-niger-seriation).
- **Ch. 36 Hit 14 / Trap 6:** platelets “> 20 × 10⁹/L” in bleeding DIC (Wada 2014, summarizing BCSH/JSTH/SISET/ISTH: transfuse bleeding DIC at ≤ 50 × 10⁹/L; 10–20 only for non-bleeding).
- **Ch. 17 Hit 3 / Trap 3:** high insulin + high C-peptide called insulinoma without excluding sulfonylureas (ENETS 2012; Peltola 2018).
- **Ch. 42 Hit 8:** plerixafor described as only for NHL/myeloma patients “failing G-CSF” (De Clercq 2019: approved 2008 for autologous mobilization in NHL/myeloma, with G-CSF).
- **Ch. 30 Hit 5:** septic arthritis defined by WBC 50,000–200,000/µL and low glucose (Long 2019: counts overlap with crystal arthritis; ~half of septic joints ≤ 28,000/µL; glucose unhelpful).
- **Ch. 72 Hit 4:** Huntington 36–39 CAG called “intermediate” (Nopoulos 2016; Chintalaphani 2021: 36–39 is reduced penetrance; 27–35 is the non-disease range that may expand).
- **Ch. 72 Hit 5:** congenital DM1 “transmitted maternally only” (Wenninger 2018: characteristically maternal, but paternal transmission is known; healthy 5–37, penetrant > 50).
- **Ch. 57 Hit 40:** Shiga toxin detected “directly in stool by EIA” (Humphries 2015; CDC 2009: EIA on enrichment broth; direct stool ~70% sensitivity).
- **Ch. 64 Hit 14:** p24 antigen called “the earliest detectable HIV marker” (CDC 2014: HIV-1 RNA appears first; p24 4–10 days later).
- **Ch. 16 Hit 4:** corrected calcium with a 4.4 g/dL reference albumin; simulator calls 4.0 “outdated” (Desgagnés 2025; Mirrakhimov 2015: the commonly used simplified Payne formula uses 4.0 g/dL).
- **Ch. 77 Hit 2:** “MR2 = 10%” (ELN 2020: 1% IS = 2 logs; 10% = 1 log).
- **Ch. 76 Hit 1:** blanket “95–100% specificity” for oncoprotein assays (NMP22 BladderChek pooled specificity 88%).
- **Ch. 76 Hit 4:** KRAS “~75% of colon cancers” (Simanshu 2017 Table 1: 42%).
- **Ch. 73 Hit 7 / Trap 2:** “ACE inhibition is a risk factor for AD” (observational evidence only; RCT meta-analysis non-significant — Belachew 2025).
- **Ch. 25 Hit 1:** acromegaly said to be “diagnosed by” OGTT GH non-suppression (Giustina 2024 consensus: IGF-I > 1.3 × ULN plus clinical signs confirms it; the OGTT is for equivocal results).
- **Ch. 62 Hit 3:** chlamydiae “can’t make ATP” (Mandel 2024; Cheong 2023: RBs scavenge host ATP, but EBs and C. trachomatis can generate ATP).
- **Ch. 62 Trap 4:** azithromycin and doxycycline presented as equal first-line chlamydia treatment (CDC 2021: doxycycline recommended; azithromycin alternative).
- **Ch. 41 Hit 10:** platelets stored “up to 5 days” (Akaraphanth 2026: 5–7 days at room temperature, plus an FDA 2023 variance for cold-stored platelets up to 14 days at 1–6 °C for active bleeding).
- **Ch. 24 Trap 3:** dilute urine given as creatinine ≤ 20 mg/dL and SG ≤ 1.0030 (DOT 40.88: creatinine ≥ 2 and < 20, SG > 1.0010 and < 1.0030 — the reviewer's numbers match clinical tampering flags); out-of-range temperature listed as a substitution criterion (DOT 40.65: a collection check that triggers an observed recollection).
- **Ch. 15 core:** "FENa > 1% suggests ATN"; a 2025 consensus treats 1–2% as indeterminate and > 2% as intrinsic.
- **Ch. 66 core:** blood-culture yields "80 / 96 / 100%" for 2 / 3 / 4 sets; Lee 2007 found 90 / 98 / 99.8%.
- **Ch. 31 core:** "MCHC increased **only** in spherocytosis"; xerocytosis also raises it, and cold agglutinins and interference raise it spuriously.
- **Ch. 57 Hit 3:** "tube coagulase positive = *S. aureus*"; ASM notes *S. schleiferi* and *S. intermedius* may also be tube-positive.
- **Ch. 1 and 13:** US-only regulation with no PH equivalents (context gap for the MTLE track).

Needs verification:
- **Ch. 43 Hit 12:** “HPCs do not express ABO antigens”; Matteocci 2024 states ABO antigens are present on HSCs. Primary CD34⁺ expression studies not read.
- Ch. 40 Hit 7: enzymes said to destroy S/s (Manduzio 2024: variable).
- Ch. 1 Hit 4: breath tests "not regulated by CLIA".
- Ch. 40 Vault #2: ">62 Rh antigens".
- Ch. 73: "4 FDA-approved Alzheimer drugs".
- Ch. 52: IUIS 2020 count.
- Ch. 40 Hit 2: "two ABO determinations" wording.
- Appendix A: the ASCP weights.
- Ch. 41 Hit 8: the ≥ 1 °C fever trigger and "never restart" (WHO 2001 allows a slow restart with a new unit).
- Ch. 43 core: minimum CD34⁺ dose 2.5 × 10⁶/kg (source read: ≥ 2 × 10⁶/kg).
- Ch. 64 core: multiplex NAATs as "the standard of care" (IDSA 2018 recommends multiplex panels for hospitalized immunocompromised patients).
- Ch. 66 Hit 1: sets "30–60 minutes apart" (CDC: within a few hours, separate sites).
- Ch. 57 Trap 2: tube coagulase "~100% sensitive" (no source read gives a figure).
- Ch. 58 Hit 5: nitrocefin as the safeguard for hidden staphylococcal β-lactamase (Ferreira 2017, S. saprophyticus: nitrocefin least sensitive, zone-edge most sensitive; S. aureus not checked).
- Ch. 41 Hit 10: end-of-storage platelet pH “≥ 6.0” (Cancelas 2022 used ≥ 6.2 as the acceptance endpoint; the current AABB/FDA criterion was not read).
- Ch. 20 Hit 4: “myoglobin doesn’t bind haptoglobin” (Petejova 2014 and Gupta 2021 say circulating myoglobin is bound mainly by haptoglobin; no primary binding study read).
- Ch. 40 Hits 10 and 15, Trap 5: anti-K titers “underestimate” risk, Doppler “regardless of titer” (Jacobs 2025 meta-analysis: 98.6% of severe cases at titer ≥ 8; guidelines differ).

Automated scan: **23** dated-guideline statements and **134** High-Yield Hits with only/always/never wording. Each must be checked when its lesson is built.

## Imported question bank

The reviewer's Exam Simulator (828 questions, answer key and explanations) is imported as-is at the rights holder's request. This app has **not** verified its questions or answers. A keyword pass links questions to open flags in the accuracy register and shows a note on those questions; 44 questions carry notes so far. A question without a note is not thereby verified. Where a lesson and a simulator explanation disagree, the lesson's checked claims and the register take precedence.

## Open lesson issues

- **ABO Forward and Reverse Typing:** 10 pending claims. These cover infant antibody age and the reverse-typing cutoff, elderly patients, IgM binding sites, tube grading, hemolysis as positive, *Ulex*, rouleaux, A2 subgroups, two ABO determinations, and emergency-release components. There are also 3 open flags: tube-grading method dependence, the age cutoff and specimen type (the discrepancy-classification flag is resolved by the new discrepancy lesson).
- **Spurious CBC Results:** 1 pending claim (rouleaux dispersal; not taught); no flags. Pseudothrombocytopenia prevalence taught as ~0.1% (reviewer: 0.1–2%).
- **Liver Panel Patterns:** 1 pending claim (light-exposure handling / FVII half-life; not taught); no flags. Reviewer quotes an AST:ALT ratio of 3–4:1 for alcoholic hepatitis; the lesson teaches the source-backed >2 threshold.
- **Streptococci and Enterococci ID:** 1 pending claim (bacitracin resistance of group B and enterococci; not taught as a stand-alone fact); 1 register flag (Hit 29). Rapid antigen sensitivity taught as ≈ 85% (≈ 40% with a light inoculum) rather than the reviewer's 31–95% range.
- **Choosing the Graft (HPC sources):** 1 pending claim (HPC ABO expression, plerixafor side effects, cord volume cut-off; not taught); 1 register flag (Hit 12, needs verification). G-CSF taught as 10 µg/kg/day × 4–6 days (reviewer: 5–10 µg/kg × 4–5 days). Bleakley 2022 read as abstract only.
- **Typing von Willebrand Disease:** 1 pending claim (type 1 share, type 3 FVIII level, LD-RIPA concentrations; not taught); 1 register flag (Hit 3). James 2021 read as abstract only; the guideline's cut-offs were taken from Tosetto & Eikenboom 2026.
- **Anion Gap Detective:** 1 pending claim (Winter’s respiratory-alkalosis direction, reviewer’s delta-ratio bands; not taught); 1 register flag (Hit 3). Delta-ratio cut-offs differ between sources (< 1; > 1.2 in one abstract; reviewer > 2.0). The MUDPILES list is not reproduced.
- **Specimen Acceptability and Transport:** 1 pending claim (C. difficile frequency and age criteria, UTI threshold, cotton toxicity; not taught); 1 register flag (Hit 4). IDSA/ASM guide read in its 2013 edition (2018 update abstract only). Urine taught as “4 °C unless ≤ 1 h” (reviewer: 2 h).
- **After the Bag Is Empty (DHTR, lookback):** 1 pending claim (DHTR 2-week presentation, Babesia timing, Philippine lookback rules; not taught); 1 register flag (Hit 14). US federal HIV lookback rules only.
- **Urine Casts (core, Ch. 29):** 1 pending claim (glitter cells, > 30 WBC/hpf, mucus, broad casts; not taught); 2 register flags (Hits 1, 5).
- **Ph-Negative MPNs:** 1 pending claim (NAP in PV, ET > 1000, reactive-thrombocytosis causes; not taught); 2 register flags (Hits 4, 5).
- **Timing the Drug Level (TDM):** 1 pending claim (phenobarbital induction, free-digoxin ultrafiltrate, half-life figures; not taught); no flags. Steady-state percentages taught as arithmetic (1 − 0.5ⁿ).
- **Herpesvirus Timelines (EBV, CMV):** 1 pending claim (EBNA-1 6–12 weeks, heterophile species, < 12-year cut-off; not taught); no flags. Monospot limit taught as “young children” (Baron 2013) rather than the reviewer’s “< 12 years”; Trap 4 not taught.
- **Apheresis Safety (citrate, ASFA, RCE):** 1 pending claim (paresthesia as early sign, calcium dose, circuit targets, RCE hematocrit; not taught); no flags. RCE HbS goal taught as “often 30–50%, varies” (reviewer: < 30%). ASFA tenth edition (2026) read as abstract only.
- **Serous Fluids (core, Ch. 30):** 1 pending claim (SAAG 98% accuracy, IFN-γ cut-off, pH > 7.30; not taught); no flags. Light’s cut-offs taught as “>” (reviewer writes “≥”).
- **Inherited Thrombophilia (Ch. 38):** 1 pending claim (FVL fold-risks, free protein S falling from the 10th week, factor II assays “blind” to G20210A, ACMG/ACOG on MTHFR; not taught); 1 register flag (rv-fvl-risk).
- **Plasma Protein Patterns (Ch. 20):** 1 pending claim (α2-macroglobulin size and 10-fold rise, δ-bilirubin, CRP bacterial vs viral, haptoglobin rebound/hemopexin, ZZ prevalence, myoglobin binding; not taught); 2 register flags (rv-myoglobin-hp, rv-bisalbumin).
- **Invasive Moulds (Ch. 60):** 1 pending claim (Aspergillus width, “lid lifter” timing, cycloheximide, calcofluor chemistry, BDG NPV for PCP, DKA as most common risk; not taught); 1 register flag (rv-gm-piptazo).
- **HDFN Surveillance (Ch. 40):** 1 pending claim (anti-G titer-ratio rule, severe ABO HDFN 0.04%, exchange thresholds; not taught); 2 register flags (rv-antik-titer, rv-rhig-vials).
- **Gram-Negative First Forks (Ch. 57):** 1 pending claim (HACEK on MacConkey, Pseudomonas odour and puncture wounds, indole; not taught); no lesson flags (register flag rv-hacek-culture concerns Hit 36).
- **DIC, Liver Disease and Fibrinolysis (Ch. 36):** 1 pending claim (D-dimer cross-link wording, low-dose heparin dose, vitamin K onset, dysfibrinogenemia TT/reptilase, VWF 300–600%; not taught); 1 register flag (rv-dic-platelets).
- **Ketones and Hypoglycemia (Ch. 17):** 1 pending claim (≤ 55 mg/dL threshold, glycated albumin standardization, 1,5-AG, “10–15%”; not taught as stated); 1 register flag (rv-cpeptide-sulfonylurea).
- **Mobilizing Stem Cells and Photopheresis (Ch. 42):** 1 pending claim (G-CSF split dosing and ceiling, bone pain 80%, GVHD > 8 × 10⁶/kg, product Hct < 7%, 24 h sun avoidance, ECP ASFA category; not taught); 1 register flag (rv-plerixafor-label).
- **Reagent-Strip Chemistry (Ch. 29):** 1 pending claim (βHB 78%, nitrite ≥ 4 h, urobilinogen oxidation, bilirubin 0.02 mg/dL, pad read times; not taught); no flags.
- **Antigen Tests and Negatives (Ch. 66):** 1 pending claim (two throat swabs, “as low as 70%”, India ink in HIV; not taught); no flags.
- **Anemia Clues Beyond the Indices (Ch. 33):** 1 pending claim (reticulocyte peak timing, isoniazid iron pattern, RPI in CKD, trait HbS %, hydroxyurea classification; not taught); no flags. Hit 16 (hydroxyurea “nonmegaloblastic”) conflicts with Kaferle 2009 and awaits a primary source.
- **Male Fertility Labs (Ch. 26):** 1 pending claim (sperm concentration limit, eosin-nigrosin colour, hCG stimulation, current testosterone guidelines; not taught); register flag rv-semen-who (existing).
- **CSF and Synovial Fluid (Ch. 30):** 1 pending claim (CSF glucose < 40 / ratio < 0.3, lactate 35 mg/dL, xanthochromia peak/duration, traumatic-tap correction; not taught); 1 register flag (rv-septic-synovial).
- **Component Dating and Processing (Ch. 41):** 1 pending claim (granulocyte ABO/temperature, ISBT 128 DIN, swirling, mechanisms behind dating rules, albumin factor content; not taught); no flags. US rules only.
- **Repeat Expansion Disorders (Ch. 72):** 1 pending claim (paternal transmission giving the largest HD expansions with juvenile onset; the reviewer's DM1 cutoffs > 100 and 1000–2000; not taught as stated); 2 register flags (rv-hd-intermediate, rv-dm1-maternal).
- **Real-Time PCR Quantification (Ch. 69):** 1 pending claim (exact Poisson formula; inhibitor and cross-assay Ct cautions shown only as mnemonic limits); 1 open lesson flag (efficiency convention: amplification factor 2.0 vs efficiency 100%); no register flags.
- **Choosing a Cytogenetic Test (Ch. 71):** 1 pending claim (reviewer high-resolution karyotype ~3 Mb and FISH ~150 kb, “score 15–20 cells”, procedure timings/loss rates/NIPS accuracy; not taught); 2 open lesson flags (FISH resolution is probe-dependent; Miller 2010 read as abstract only); no register flags.
- **DNA Sequencing: Sanger, Pyrosequencing and NGS (Ch. 68):** 1 pending claim (“sequenced the first human genome (2001)” as phrased; NGS clinical examples; not taught as stated); 1 open lesson flag (Ronaghi pyrosequencing papers not accessible); no register flags.
- **Pharmacogenomics (Ch. 67):** 1 pending claim (neuropsychiatric examples, SNP rate, molecular testing vs morphology; not taught); 1 open lesson flag (CPIC recommendations are indication-specific); no register flags.
- **Hybridization Assays (Ch. 70):** 1 pending claim (reviewer “< 4-fold” threshold; Holm–Bonferroni and Benjamini–Hochberg by name; not taught); 2 open lesson flags (fold threshold wording; 2005 line-probe data may be outdated); no register flags.
- **Bacterial Stool Pathogens and STEC (Ch. 57):** 1 pending claim (Shigella non-motile/H2S-negative, Yersinia cold enrichment, “never” antibiotics for all STEC; not taught); 1 register flag (rv-stx-direct-stool); sources read via page fetch.
- **Urine Culture Interpretation (Ch. 66):** 1 pending claim (urinary pathogen lineup; ≤ 2 h / ≤ 24 h processing window; not taught); 3 open lesson flags (≥ 10⁵ = bacteriuria not infection; pyuria in catheterized patients; processing window; two guidelines read via page fetch); no register flags.
- **HIV and HCV Testing Algorithms (Ch. 64):** 1 pending claim (HIV viral-load monitoring, HCV SVR12, HBV IgM anti-HBc, 2018 HIV update; not taught); 1 register flag (rv-hiv-earliest-marker).
- **Mature B-Cell Neoplasm Phenotypes (Ch. 34):** 1 pending claim (del17p, HCL therapy, Burkitt/B-ALL, FL bcl-6; not taught); 2 open lesson flags (CLL definition missing duration/cytopenia rule; BRAF V600E not universal); no register flags.
- **Hypercalcemia: PTH, PTHrP and Adjusted Calcium (Ch. 16):** 1 pending claim (80–90% share, urinary cAMP, PTHrP 50–90%, CKD secondary/tertiary HPT; not taught); 1 register flag (rv-calcium-ref-albumin).
- **Wilson Disease (Ch. 27):** 1 pending claim (ceruloplasmin as acute-phase reactant, serum copper as poor screen, Menkes; not taught); 1 open lesson flag (ceruloplasmin cut-off context); no register flags.
- **Pseudohyponatremia and Jaffe Creatinine (Ch. 28):** 1 pending claim (ultracentrifugation, Jaffe wavelength, mitigation chemistry, aminoglycosides, low-protein bias; not taught); 1 open lesson flag (manufacturer lipemia limits); no register flags.
- **CML BCR-ABL1 on the International Scale (Ch. 77):** 1 pending claim (0.5–1 log rise trigger for mutation testing, isoforms, MRD range; not taught); 1 register flag (rv-cml-mr2).
- **HER2 ISH Groups (Ch. 78):** 1 pending claim (primary ASCO/CAP 2018 text, 2023 update; not taught beyond secondary summaries); 2 open lesson flags (guideline read via secondary sources; Group 3 needs IHC); no register flags.
- **Forensic DNA Markers (Ch. 74):** 1 pending claim (“1 in 1 nonillion”, mtDNA ~1 in a few thousand, STR repeat-unit size, mnemonic limitations; not taught); no flags.
- **Genotyping Before Treatment (Ch. 75):** 1 pending claim (DPD deficiency 3–5%, 25–50% range, FDA labels, HLA mechanism; not taught); 2 open lesson flags (TPMT guidance updated in CPIC 2025; abacavir guideline read via page fetch/abstract); no register flags.
- **ANA by HEp-2 IIFA (Ch. 53):** 1 pending claim (specific list of IFA-missed antibodies, WHO 1:40/1:160 reporting, solid-phase assays; not taught); no flags.
- **Immunoassay Formats and Hook Effect (Ch. 45):** 1 pending claim (homogeneous vs heterogeneous, EMIT/FPIA/RIA; not taught); 1 open lesson flag (hook is sandwich-specific); no register flags.
- **QC: Levey–Jennings and Westgard Rules (Ch. 11):** 1 pending claim (1₂s false-alert rate, detailed failure sequence, CLSI C24, power functions, other rule definitions; not taught); 1 open lesson flag (US CLIA only); no register flags.
- **Sensitivity, Specificity and Predictive Values (Ch. 8):** 1 pending claim (ROC/AUC, cut-off direction, LR prevalence independence, spectrum; not taught as fact); 1 open lesson flag (f-lr-prev: “LRs not affected by prevalence” lacks the disease-spectrum caveat); no register flags.
- **Oncoproteins and Tumour Markers: RAS, p53, NMP22 (Ch. 76):** 1 pending claim (NMP22 cut-offs, ras-p21 ranges, p53 half-life, anti-p53 15% vs 1%, “mostly G12V”, Hits 6–13 single-study figures; not taught); 2 open lesson flags; register flags rv-oncoprotein-spec, rv-kras-colon.
- **How Analyzers See: Absorbance, Scatter and Chemiluminescence (Ch. 4):** 1 pending claim (A < 2.0 linearity limit, 350 nm glass/quartz cut-off, 15–90° nephelometry range, PMT/filter figures, fluorescence/phosphorescence lifetimes; not taught); 1 open lesson flag (f-neph-angle, method-dependent); no register flags.
- **Alzheimer Genetics: APOE ε4, Presenilins and CSF Aβ42/40 (Ch. 73):** 1 pending claim (age-specific penetrance, Aβ42/Aβ40 toxicity roles, PSEN ratio shift, ACE claim, drug roster details; not taught); 1 open lesson flag (f-ace-ad); register flag rv-ace-ad.
- **Expression Profiling and Overfitting (Ch. 79):** 1 pending claim (SAGE enzyme details, probe/target naming, HGP and WES figures, SELDI/MALDI, named classifier figures, HRM/xTAG; not taught); no open lesson flags; no register flags.
- **Whole-Blood Donor Eligibility:** 1 pending claim (age, 10-minute collection, directed donors; not taught); 1 register flag (Hits 15–16). US FDA rules only; Philippine donor criteria not checked.
- **β-Lactamases (ESBL, AmpC, CPE):** no pending claims; 2 register flags (Trap 5 aztreonam; Hit 5 nitrocefin, needs verification). Nitrocefin colour/timing and the temocillin OXA-48 screen are not taught.
- **Troponin and Myocardial Injury:** 1 pending claim (sepsis as a cause; not taught); 1 register flag (Fifth UDMI). Numeric ng/L thresholds and type 4a/5 multiples are not taught.
- **Hemophilia in the Lab:** no pending claims; 1 register flag on Hit 5 (mild range). Prevalence, bleed frequencies, intron 22 and inhibitor percentages are not taught; the source gives the Bethesda detection limit as 0.42 BU/mL (reviewer: ~0.5).
- **Choosing the Component:** 1 pending claim (platelets in ITP/TTP; CCI < 7,500 definition; neither taught); 2 register flags (Hit 5 acute-MI trigger; Hit 7 cryo trigger). Per-unit increments and the 100 × 10⁹/L CNS platelet threshold are not taught.
- **Tick-Borne Rickettsial Diseases:** 1 pending claim (Weil–Felix obsolete, < 20% seropositive at presentation, Coxiella by inhalation; none taught); 1 register flag on Trap 5. Q fever chronic cut-off taught as CDC ≥ 1:1024 with the Duke > 1:800 criterion (reviewer: ≥ 1:800).
- **Pancreatic Enzymes:** 1 pending claim (lipase 8–14-day duration; not taught); 1 register flag on Hit 2 (diagnostic criteria). The reviewer’s 48–72-h amylase normalisation differs from the source read (3–5 days) and is not taught. Choi 2023 is in Korean; only its English tables were used.
- **Hemolytic Anemia Workup:** 1 pending claim (splenectomy rationale in HS; Ham test as historical; neither taught); 1 register flag on Hit 5 (osmotic fragility).
- **DAT Patterns and AIHA Workup:** 1 pending claim (IgM dissociation leaving C3d; post-viral timing of PCH; neither taught); no flags. The reviewer’s “70–80% of AIHA” warm figure and CAD thermal amplitude are not taught.
- **Chlamydia and Mycoplasma:** no pending claims; 2 register flags (Hit 3 energy metabolism; Trap 4 regimen, not taught). EB/RB sizes are not taught.
- **Dynamic Endocrine Testing:** 1 pending claim (the CBG mechanism behind estrogen-related DST false positives); 1 register flag on Hit 1 (acromegaly diagnosis). The GHD cut-off (3 µg/L) is not taught because thresholds are assay-dependent.
- **Erythropoiesis and RPI:** 1 pending claim (shift-reticulocyte mechanism and ~1-day normal maturation); no flags. Notes that labs band hematocrit differently for maturation time, and that the reviewer’s ⁵¹Cr and 3-million-cells-per-second figures are not taught.
- **Component Storage and Irradiation:** 1 pending claim (RBC transport 1–10 °C, the US 5-day thawed-plasma relabel, never irradiating HPCs; none stated as numbers); 2 register flags on Hit 10 (5-day platelet storage, verified; pH ≥ 6.0, needs verification). Irradiation dose taught as the US FDA rule, with the Council of Europe range noted.
- **hCG and PUL:** 1 pending claim (progesterone ng/mL cut-offs); 2 register flags on Hits 1–2.
- **Susceptibility testing (MIC, breakpoints, D-test):** 1 pending claim (current CLSI wording for reporting clindamycin as resistant after a positive D-test, and exact broth-microdilution conditions); no flags. Breakpoint numbers are deliberately not taught because they change with each CLSI M100 edition.
- **Flow Cytometry Gating:** 1 pending claim (hemodilution/lysis explanation); no flags. Adds the genetic AML exceptions to the 20% blast threshold.
- **Antibody ID — Dosage and Kidd:** 1 pending claim (DHTR 5–10 days); 1 register flag (S/s enzyme effect, needs verification). Adds Rh (non-D) to the dosage list.
- **Syphilis Serology:** no pending claims; no flags. Notes CDC’s 15–25% treponemal seroreversion after primary-stage treatment (reviewer: “up to 20%”) and the “lipoidal antigen” terminology.
- **LDL Calculation:** no pending claims; 1 register flag on Trap 2.
- **CML vs Leukemoid Reaction:** 1 pending claim (WBC often > 30 × 10⁹/L); no flags. Adds context that the LAP/NAP score is rarely used now.
- **Weak D, Partial D and DEL:** 1 pending claim (D-site numbers); no flags. Adds context on Asian-type DEL recipients and other weak D types that make anti-D.
- **Malaria Films:** 1 pending claim (15–30× blood per thick-film field; Wright pH < 6.8); no flags.
- **Enzyme Kinetics:** 1 pending claim (Km rate-constant expression); no flags.
- **Anticoagulant Monitoring:** 1 pending claim (spiked plasma; normal anti-Xa excluding Xa inhibitors; APTT plateau); no flags. Adds context that routine LMWH anti-Xa monitoring is not recommended in standard patients.
- **TRALI vs TACO:** 1 pending claim (48–96 h resolution and ~10% mortality; source read: 48–72 h, 5–25%); 1 register flag on Hit 4.
- **AFB Smears:** 2 pending claims (centrifugation force/volume; heat vs phenol mordant and NALC mucolytic role); no flags.
- **Drug Screens:** 2 pending claims (TLC as a confirmation method; GC-MS vs LC-MS/MS by volatility/derivatization); 2 register flags on Trap 3.
- **Lupus Anticoagulant:** 1 pending claim (immediate-acting; strongest lab risk factor; 99th-percentile cut-off); no open flags.
- **Stem-Cell Products: CD34⁺ Dose and Cryopreservation:** 2 pending claims (CFU timing; reviewer's freezing ramp, storage temperature and DMSO reinfusion toxicity) and 1 open flag (minimum dose).
- **Dimorphic Fungi:** 2 pending claims (Histoplasma size and narrow-based budding; no lab conversion of Coccidioides) and 1 open flag (spherule size varies by source).
- **Serum Protein Electrophoresis:** 1 pending claim (background γ suppression beside an M-spike); no open flags.
- **Glanzmann vs Bernard-Soulier:** 2 pending claims (ristocetin works on fixed platelets; receptor roles stated as physiology) and 1 open flag (ristocetin may show a reduced second wave in GT).
- **Therapeutic Plasma Exchange:** 1 pending claim (the reviewer's < 15% and 60–70% FFP figures) and 1 open flag (Hit 2 kinetics).
- **Respiratory Virus Testing:** 2 pending claims (amplification doubling, NAAT persistence after infection) and 1 open flag ("standard of care" wording).
- **Hepatitis B Serology:** 1 pending claim (HCV figures, not taught) and 3 open flags (chronicity figures, the "sole marker" wording, HCV part of Hit 10 not taught).
- **PT, APTT and the Mixing Study:** 2 pending claims (factor XIII not measured by PT/APTT/TT, the prekallikrein incubation effect) and 1 open flag (Hit 2's thrombin-time and FXIII content not taught).
- **ABO Discrepancies: Four Types and the Workup:** 2 pending claims (subgroups and myeloma as named causes, relative frequency of rare causes) and 1 open flag (the reviewer's workup order differs from the source's).
- **Blood Cultures: Volume, Sets and Contamination:** 2 pending claims (low organism counts per mL, single-set S. aureus treated as real) and 2 open flags (yield figures, collection interval).
- **FENa: Prerenal vs ATN:** 2 pending claims (the formula, normal FENa in healthy people) and 1 open flag (the reviewer's > 1% cut-off).
- **Red-Cell Indices and the Too-High MCHC:** 3 pending claims (index formulas, the analyzer Hct/Hb mechanism, other causes of low MCHC) and 1 open flag (the reviewer's "only in spherocytosis").
- **Acute Hemolytic Transfusion Reaction and ABO Compatibility:** 1 pending claim (the fever threshold, febrile-reaction course and restart rule) and 1 open flag (restart practice is guideline-dependent).
- **Gram-Positive Cocci: Catalase, Coagulase and MRSA:** 2 pending claims (PBP2a's low β-lactam affinity, tube coagulase sensitivity; enterococcal catalase now checked against Gajic 2026) and 2 open flags (the ~100% figure, Hit 3's missing exceptions).
- **CLIA '88:** 3 pending claims (the accreditor list, the number of states licensing personnel, inspection of waived labs) and 3 open flags (US-only scope, generic test-complexity examples, breath tests).
