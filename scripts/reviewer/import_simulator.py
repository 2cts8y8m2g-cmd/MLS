#!/usr/bin/env python3
"""Import the reviewer's Exam Simulator (questions + answer key) into a question-bank file.

The reviewer's rights holder asked for this import (2026-10-07). The questions, answers and
explanations are the reviewer's own and are NOT verified by this app; known problems are
linked to the reviewer accuracy register through keyword rules below.

Usage:
  mkdir -p source/epub && (cd source/epub && unzip -o ../reviewer.epub)
  python3 scripts/reviewer/import_simulator.py source/epub/OEBPS content/question-bank/reviewer-simulator.json
"""
import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

NS = {'h': 'http://www.w3.org/1999/xhtml'}
ROOT = Path(__file__).resolve().parents[2]

# (flag id, regex over stem + options + explanation, note shown to learners)
FLAG_RULES = [
    ('rv-urine-cytology', r'first[- ]morning[^.]{0,80}cytolog|cytolog[^.]{0,80}first[- ]morning',
     'A reference laboratory states first-morning urine is not suitable for cytology; second-morning urine is preferred.'),
    ('rv-eyewash-100ft', r'eyewash|eye wash',
     'OSHA requires eyewash facilities “within the work area”; guidance adds reach within about 10 seconds. The 100-ft figure comes from a 1992 OSHA letter.'),
    ('rv-id-rates', r'12,000|1 in 1,000|wrong blood in tube|WBIT',
     'The reviewer’s identification and transfusion-error rates could not be matched to published sources (e.g., Linden 2000 reports 1 in 19,000 units).'),
    ('rv-fluoride-days', r'fluoride[^.]{0,120}(3|three) days|(3|three) days[^.]{0,120}fluoride',
     'WHO 2010 says fluoride preserves glucose “up to five days”, not three.'),
    ('rv-biotin-fda', r'biotin',
     'FDA updated its 2017 biotin warning in 2019; biotin makes sandwich assays falsely low and competitive assays falsely high.'),
    ('rv-heel-depth', r'heel[^.]{0,80}(2\.0|2) ?mm|lancet[^.]{0,40}(2\.0|2) ?mm',
     'WHO 2010 sets heel-prick depth at no more than 2.4 mm; the 2 mm figure comes from another guideline.'),
    ('rv-abg-cooling', r'(arterial|blood gas)[^.]{0,120}\bice\b|\bice\b[^.]{0,120}(arterial|blood gas)',
     'Sources disagree on icing blood-gas samples (WHO 2010 uses an ice cup; Sood 2010 says do not cool). Follow lab policy.'),
    ('rv-order-draw-evidence', r'order of draw',
     'The order of draw matches WHO 2010, but closed-system studies did not always find EDTA carry-over from wrong order alone.'),
    ('rv-clia-exempt-states', r'exempt',
     'CMS lists Washington (full) and New York (partial) as CLIA-exempt states; D.C. is not listed.'),
    ('rv-prion-surfaces', r'prion',
     'Check prion decontamination details against current WHO/CDC guidance; see the register for specifics.'),
    ('rv-hazcom-2024', r'\bSDS\b|safety data sheet|hazard communication|\bGHS\b',
     'OSHA amended the Hazard Communication standard in May 2024; SDS mixture cut-offs are “≥ 1%, ≥ 0.1% for carcinogens”.'),
    ('rv-isbt-systems', r'blood group systems|ISBT',
     'ISBT counts change as new systems are recognized; check the current ISBT table.'),
    ('rv-clsi-m100', r'\bM100\b|CLSI breakpoint',
     'CLSI M100 is revised every year; check the current edition.'),
    ('rv-semen-who', r'semen|sperm',
     'WHO semen-analysis reference values changed in the 6th edition (2021); check which edition the question assumes.'),
    ('rv-dilute-criteria', r'dilute (urine|specimen)|creatinine[^.]{0,60}specific gravity|substituted',
     'US DOT laboratory criteria: dilute = creatinine ≥ 2 and < 20 mg/dL with SG > 1.0010 and < 1.0030; substituted = creatinine < 2 mg/dL with SG ≤ 1.0010 or ≥ 1.0200. Temperature is a collection check, not a substitution criterion.'),
    ('rv-trali-bnp', r'TRALI[^.]{0,160}BNP|BNP[^.]{0,160}TRALI',
     'Natriuretic peptides are raised in severe TRALI and critical illness (Vlaar 2019); a low BNP argues against TACO, but a high BNP does not exclude TRALI.'),
    ('rv-direct-ldl', r'direct (\(homogeneous\) )?(LDL|low-density)|homogeneous LDL',
     'Direct LDL-C assays are method-dependent and can be biased in high-TG samples; HEART UK/ACB does not recommend them in hypertriglyceridaemia (non-HDL-C, Sampson–NIH or apoB instead).'),
    ('rv-hcg-zone', r'discriminatory|no intrauterine gestational sac',
     'The discriminatory zone varies by centre (some use 3,500 mIU/mL) and should not by itself diagnose ectopic pregnancy; repeat hCG and ultrasound.'),
    ('rv-hcg-rise', r'48 hours|53 ?%|in 2 days',
     'Newer data put the minimal 48-h hCG rise for a viable intrauterine pregnancy at about 35%; the older 53% threshold misclassifies some viable pregnancies.'),
    ('rv-plt-storage', r'platelet[^.]{0,80}(up to|≤) ?5 days',
     'Platelet storage is now 5–7 days at 20–24 °C where bacterial-risk controls are used, and licensed cold-stored platelets (FDA 2023 variance, up to 14 days at 1–6 °C) are an exception (Akaraphanth 2026).'),
    ('rv-plt-ph', r'pH ?(≥|>=) ?6\.0',
     'A 2022 US licensing study used end-of-storage platelet pH ≥ 6.2 as its acceptance endpoint; the reviewer’s ≥ 6.0 is unconfirmed.'),
    ('rv-acro-ogtt', r'acromegaly is diagnosed by failure of GH',
     'The 2024 Acromegaly Consensus confirms acromegaly with IGF-I > 1.3 × ULN plus clinical signs; the OGTT is reserved for equivocal results (Giustina 2024).'),
    ('rv-acs-trigger', r'8\.0 only in acute coronary|<8\.0 g/dL in acute coronary',
     'The MINT trial (acute MI) found a restrictive 7–8 g/dL strategy may increase MI or death; a fixed restrictive trigger in acute MI is contested (Yang 2026).'),
    ('rv-cryo-trigger', r'fibrinogen when <100 mg/dL',
     'Current reviews place increased bleeding risk below ~200 mg/dL fibrinogen (population-dependent); AABB requires ≥ 150 mg fibrinogen per cryo unit (Rahe-Meyer 2026).'),
    ('rv-hemo-mild', r'mild 6[–-]30|6[–-]30 ?%',
     'Standard classification: mild hemophilia is > 5–40 IU/dL (severe < 1, moderate 1–5) (Alvarez-Payares 2026).'),
    ('rv-udmi-fifth', r'Fourth Universal Definition',
     'The Fifth Universal Definition of MI (2026) now applies: sex-specific 99th percentile URLs, and MI classified as primary, secondary or procedure-related (Mills 2026).'),
    ('rv-mbl-aztreonam', r'aztreonam (stays|remains) active|metallo[^.]{0,80}aztreonam',
     'MBLs spare aztreonam, but co-produced ESBL/AmpC enzymes often inactivate it — hence aztreonam–avibactam (Khan 2026).'),
    ('rv-donor-hb', r'(≥|>=) ?12\.5 g/dL minimum|ALL whole-blood donors',
     'US rule (21 CFR 630.10): female allogeneic ≥ 12.5 g/dL (12.0–12.5 only under an FDA-acceptable procedure); male allogeneic ≥ 13.0 g/dL.'),
    ('rv-entero-beta', r'PYR-positive beta-hemolytic streptococcus = Enterococcus',
     'Enterococcus is its own genus, and most isolates are not β-hemolytic (about 20% were in one 2026 study). The answer stands, but confirm Enterococcus by growth in 6.5% NaCl and a positive bile esculin test.'),
    ('rv-hpc-abo', r'HPCs lack ABO antigens',
     'One 2024 review states that ABO antigens are present on hematopoietic stem cells, so the reason given here is uncertain. The practical point stands: ABO mismatch is not a contraindication, and incompatible red cells (major) or plasma (minor) in the product are reduced.'),
    ('rv-vwd-ratio', r'below 0\.6 = qualitative|RCo/vWF:Ag[^.]{0,30}0\.6',
     'The 2021 ASH ISTH NHF WFH guideline suggests an activity/antigen ratio below 0.7 (not 0.6) to confirm type 2 VWD, with low certainty. A ratio of 0.51 is type 2 under either rule.'),
    ('rv-sputum-criteria', r'<\s?25 epithelial cells|fewer than 25 epithelial cells',
     'These two cut-offs conflict: a sputum with 11–24 squamous cells would be both acceptable and rejected. One published rule accepts < 10 squamous cells with > 25 leukocytes per LPF; each laboratory sets its own criteria.'),
    ('rv-rbc-casts', r'RBC casts and dysmorphic RBCs prove',
     'RBC casts are usually glomerular, but they also occur in some acute interstitial nephritis (29% in one biopsy series). Here, with dysmorphic RBCs after a strep infection, the answer stands.'),
    ('rv-fvl-risk', r'80-fold',
     'Published relative risks for homozygous factor V Leiden range from about 10-fold (Khider 2022) to 80-fold (Nakashima & Rogers 2014); the reviewer’s own Ch. 38 Hit 3 says 10–15×. The answer (incomplete penetrance) stands.'),
    ('rv-gm-piptazo', r'piperacillin',
     'Piperacillin-tazobactam false positives came from contaminated lots; a 2014 US study found no galactomannan in 32 current lots (1 of 27 patient sera positive), so it is now a rare cause. Interpret a positive result with the clinical and CT picture rather than dismissing it.'),
    ('rv-niger-seriation', r'uniseriate phialides covering the entire vesicle',
     'A. niger is biseriate (Samson 2007); uniseriate black aspergilli include A. japonicus and A. aculeatus. Among the options, A. niger is still the intended answer.'),
    ('rv-antik-titer', r'titers underestimate',
     'Anti-K does suppress fetal erythropoiesis, but a 2025 meta-analysis found 98.6% of severe anti-K HDFN at maternal titers ≥ 8 and supports a (low) critical titer; guidelines differ. The answer’s mechanism stands; “titers underestimate danger” is an oversimplification.'),
    ('rv-rhig-vials', r'60 mL of fetal whole blood',
     'Technical guidance (cited by Hajjaj 2025) divides by 30, rounds, then adds one vial: 60 mL → 2 + 1 = 3 vials. Practice varies between laboratories; check your local policy.'),
    ('rv-cpeptide-sulfonylurea', r'insulinoma gives high insulin',
     'High insulin with high C-peptide means endogenous insulin: an insulinoma or a sulfonylurea/meglitinide. ENETS criteria require a negative sulfonylurea screen. The answer for this question (low C-peptide = injected insulin) stands.'),
    ('rv-hd-intermediate', r'36–39 repeats is the intermediate',
     'Open sources (Nopoulos 2016; Chintalaphani 2021) classify HTT 36–39 CAG as reduced penetrance, not intermediate; 27–35 is the non-disease range that may expand. Expansion is more likely in male transmission, so the answer’s parent-of-origin point stands.'),
    ('rv-dm1-maternal', r'transmitted maternally only',
     'Congenital DM1 is characteristically maternal, but paternal transmission is reported (Wenninger 2018). The answer is the best choice here; “only” is an overstatement.'),
    ('rv-hiv-earliest-marker', r'p24 antigen is the earliest detectable',
     'CDC 2014: HIV-1 RNA (by NAT) is detectable about 4–10 days before p24 antigen. Among the options offered here p24 is still the earliest, so the answer stands; the explanation overstates it.'),
    ('rv-calcium-ref-albumin', r'4\.4 ?[-−–] ?\d|outdated Payne',
     'Open sources (Desgagnés 2025; Mirrakhimov 2015) give the commonly used simplified formula with a 4.0 g/dL reference albumin, not 4.4; with 4.0 this example gives 8.4 + 0.8 × 2.0 = 10.0 mg/dL (still normal). Laboratories may use local formulas; ionized calcium is preferred.'),
    ('rv-oncoprotein-spec', r'Oncoprotein assays have 95–100% specificity',
     'Specificity is marker-specific: the NMP22 BladderChek test had pooled specificity 88% (Wang 2017), so a positive marker needs confirmation (e.g. cystoscopy). Answer (c) is still the best choice here: a positive does not name the tissue of origin, but “strongly implied” overstates it.'),
    ('rv-ace-ad', r'ACE inhibition is a risk factor',
     'The explanation’s added claim that ACE inhibition is a risk factor for AD is not established: a 2025 meta-analysis found only observational support and a non-significant RCT comparison (Belachew 2025). The ACE Aβ42→Aβ40 claims in this question were not verified by the app.'),
    ('rv-cdc-absolute', r'an absolute contraindication to renal transplantation',
     'For an IgG donor-specific HLA antibody this is the classic answer. But not every positive CDC crossmatch is a veto: positives that disappear with DTT (IgM, often autoreactive) are standard risk, and lupus immune complexes can cause false-positive B-cell results (Althaf 2017). Check antibody class and specificity.'),
    ('rv-acid-isolation', r'Isolation makes concurrent transactions behave as if executed sequentially',
     'The answer (Isolation) stands: the report saw part of an unfinished edit. But “behave as if executed sequentially” describes only the strictest (serializable) isolation level; databases offer weaker levels, and PostgreSQL defaults to Read Committed. In general, isolation means a transaction’s changes are not visible to others before it commits.'),
    ('rv-exempt-determiner', r'never the investigator',
     'Answer (d) matches common institutional practice. But the Common Rule text (45 CFR 46.104) does not say who makes the exemption decision; institutions set that procedure, often assigning it to the IRB office. “Never the investigator” is a policy norm, not a rule found in the regulation itself.'),
    ('rv-vanb-teicoplanin', r'vanB affects vancomycin only',
     "sim-q525: the answer (vanA) still stands, because the isolate is teicoplanin-resistant. Describing vanB as affecting vancomycin only is consistent with VanB teicoplanin MICs of 0.5-1 mg/L, but O'Driscoll 2015 gives VanB vancomycin MICs of 4-1,000 mg/L, so vanB is not always low-level."),
    ('rv-oxacillin-s-mecc', r'oxacillin-susceptible S[.] aureus = MSSA',
     "sim-q804 (Ch. 57): the answer (penicillin G fails, nafcillin/oxacillin work) still stands for a mecA-negative, penicillinase-positive isolate. However, Paterson 2014 reports that on Vitek 2 most mecC MRSA are oxacillin-susceptible but cefoxitin-resistant, so 'oxacillin-susceptible = MSSA' should be confirmed with cefoxitin."),
    ('rv-mssa-penicillinase-zone-edge', r'pairs the MIC with nitrocefin',
     'sim-q529: the answer stands, because CLSI/EUCAST do recommend phenotypic penicillinase testing. Takayama 2018 notes that nitrocefin is reported less sensitive than the penicillin zone-edge test, so a negative nitrocefin alone does not prove the isolate lacks penicillinase.'),
    ('rv-fd-lipid-pattern', r'(?i)equal elevations? of cholesterol and triglycerides',
     "sim-q163 (the only match in the bank): the answer, type 3 dysbetalipoproteinemia (apoE2/E2), still stands because palmar crease xanthomas are considered pathognomonic. However, Heidemann 2022 says the lipid pattern is usually mixed rather than necessarily equal, and the broad-beta band is highly specific but has low sensitivity. Formal diagnosis needs the phenotype (ultracentrifugation or apoB methods) plus a causal APOE genotype, so 'confirmed by the broad-beta band' overstates the case."),
    ('rv-entamoeba-antigen-only', r'fecal antigen test must distinguish',
     "sim-q589: the keyed answer (order a test to tell E. histolytica from E. dispar before treating) still stands among the options given. But the explanation's 'must' is too strong: the test has to be a histolytica-specific antigen kit or PCR, and CDC DPDx says molecular methods are currently recommended."),
    ('rv-esr-100-cancer', r'(?i)ESR (above|>|over) ?100 mm/h in a (known )?cancer patient usually (means|signals) metastases',
     'Tested against all simulator questions: the regex matches only sim-q279 (metastatic prostate cancer, ESR 115), in both option b and the explanation. Answer b can stand as the best of its options because metastatic disease is already known. The explanation overstates the case, though: open sources say ESR >=100 in adults with solid tumours is often associated with metastasis, and infection is the most common cause of ESR >=100, so infection should still be considered.'),
    ('rv-fvl-ch72-penetrance', r'lifetime penetrance is only ~10%',
     'sim-q639: option d is still the best of the four, because a large relative risk does not mean a clot is certain. But no source read supports its ~10% lifetime penetrance figure. Khan & Dickerman 2006 cite an estimate that homozygotes can be expected to have at least one VTE in their lifetime, so treat the figure as unverified and possibly too low for homozygotes.'),
    ('rv-mthfr-not-thrombophilia', r'MTHFR C677T is not an independent adult VTE risk factor',
     "sim-q54 and sim-q354: the answers stand. Deloughery 2022 and ASH 2023 go further than 'not independent': MTHFR variants are not associated with VTE, and BSH 2022 and ACMG/ACOG advise against testing them in thrombophilia workups."),
    ('rv-16s-definitive', '16S rRNA sequencing.{0,40}(universal primers|definitive)',
     "sim-q819 (Ch. 57; tested, this is the only match among the simulator questions) gives 16S sequencing as the answer for an isolate no biochemical panel could identify. The answer still stands, but the option's 'definitive bacterial identification' overstates it. Janda 2007 reports genus-level identification in >90% of cases but species-level in only 65-83%, with poor resolution for Bacillus, Enterobacter/Pantoea and the mitis group, and Church 2020 notes that 16S cannot separate species within the M. tuberculosis complex."),
    ('rv-micro-critical-list-local', 'Positive CSF Gram stain = critical value',
     'Matches sim-q824 only. The answer still stands: bacteria on a CSF Gram stain appear on published critical lists (Croatian national recommendations), and read-back with documentation is recommended. The explanation should make clear that each laboratory defines its own critical list.'),
    ('rv-micro-reporting-us-law', 'Corrected report \\+ direct provider notification|notifiable diseases .{0,3} public health by law',
     'Matches sim-q826 and sim-q827 only. The answers still stand under US rules: 42 CFR 493.1291(k) requires prompt notification, a corrected report and keeping both the original and the corrected report, and CDC says state and territorial laws set which diseases are reportable. The explanations do not cover Philippine requirements.'),
    ('rv-ocb-not-ms-specific', 'intrathecal IgG synthesis,? supporting multiple sclerosis',
     'sim-q481: the answer still stands. Type 3 indicates intrathecal IgG synthesis, and in a patient with relapsing optic neuritis it supports MS. Jin 2023 and Trbojevic-Cepe 2004 note that type 2 and 3 patterns also occur in CNS infections and autoimmune or inflammatory disorders, so the pattern by itself is not specific for MS. Searching stem plus explanation, the regex matches only sim-q481.'),
    ('rv-crc-braf-predictive', 'BRAF mutation is an additional resistance marker',
     "sim-q662 (RAS wild-type, BRAF V600E colorectal cancer) keys option b, 'BRAF V600E is an additional resistance marker ... anti-EGFR therapy is unlikely to benefit'. It is defensible as the best option, but Sepulveda 2017 found insufficient evidence to use BRAF V600 as a predictive marker (decreased response rate, yet data consistent with modest benefit relative to RAS-mutant tumours), so the explanation overstates certainty."),
    ('rv-ch75-us-approvals', 'FDA labels require wild-type RAS',
     "sim-q662's explanation cites US FDA label requirements, which were not verified in this session and are US-specific. The RAS-testing requirement itself is supported by the ASCP/CAP/AMP/ASCO 2017 guideline (KRAS and NRAS exons 2, 3, 4)."),
    ('rv-ch77-myd88-not-exclusive', 'MYD88 L265P is present in >90% of Waldenstr',
     "sim-q670: MYD88 L265P is still the best answer among the options. But the explanation's 'essentially diagnostic' overstates it, and the stem's 'over IgM MGUS' is a problem, because Shin 2016 reports MYD88 L265P in up to 87% of IgM MGUS. Yan 2024 also shows that detection depends on the method used."),
    ('rv-ch77-ighv-borderline', 'unmutated IGHV \\(≤2% divergence',
     'sim-q672: the answer stands. Unmutated IGHV (98% or more identity) and TP53 disruption are adverse, and ERIC 2018 reports that targeted agents work in TP53-disrupted CLL. ERIC adds a 97-97.99% borderline zone and says subset #2 is adverse regardless; the explanation leaves both out.'),
    ('rv-1p19q-needs-idh', '1p/19q codeletion in oligodendroglioma',
     'The sim-q675 explanation pairs 1p/19q codeletion with oligodendroglioma. The keyed answer (temozolomide for MGMT-methylated glioblastoma) still stands. WHO 2021 adds that oligodendroglioma also requires an IDH mutation, and Ball 2020 adds that the codeletion must be whole-arm.'),
    ('rv-pcv-not-exclusive', 'PCV chemotherapy response is predicted by 1p/19q',
     "The sim-q675 explanation says 1p/19q codeletion predicts PCV response. The keyed answer still stands. RTOG 9402 shows the benefit in codeleted tumours only in an unplanned analysis ('not flawlessly predictive'), and EANO 2021 also uses PCV for IDH-mutant astrocytoma grade 2."),
    ('rv-abn-routine', '(?i)Advance Beneficiary Notice[^.]*must be given in writing before service',
     "sim-q137 (vitamin D screening likely denied for medical necessity) still stands: option a is the best answer, because CMS requires an ABN before the service when Medicare is not likely to cover a specific test. But the option wording ('stating Medicare may not cover the test') and the explanation are thinner than the rule. Per the OIG, the notice must name the test and the reason denial is likely, and should be given only when there is genuine doubt about payment. A notice that only says payment might be denied, or one given routinely, is not acceptable."),
    ('rv-ch67-snp-rate-context', 'SNPs occur at ~1 per 1000 bp',
     "sim-q602 answers ~1 SNP per 1000 bp. The answer still stands as the conventional approximation (Bell 2002), but the density depends on what is compared: resequencing genes across many people finds about 1 per 185 bp (Hoehe 2004), and a typical genome differs from the reference at 4.1-5.0 million sites (1000 Genomes 2015). The explanation's 'roughly 3 million differences between unrelated people' was not checked against a source."),
    ('rv-xla-live-vaccine-list', '(?i)agammaglobulinemia.{0,120}live vaccines are contraindicated',
     "sim-q499 (XLA: begin IVIG and withhold all live vaccines). The answer still stands: the distractor gives MMR, which CDC lists as contraindicated in severe antibody deficiency, and CDC advises no vaccines during immunoglobulin therapy for B-cell deficiency. However, the CDC table does not list varicella or rotavirus, so 'all live vaccines' is broader than the listed US contraindications."),
    ('rv-ch28-hct-mechanism', '(?i)occludes? (?:the )?POCT strips?|extra plasma through',
     "sim-q234 (polycythaemia, falsely low POCT glucose): the answer stands, because high haematocrit is associated with lower meter readings. The explanation's mechanism (RBCs occlude the strip, anaemia lets extra plasma through) is a simplification. Sources describe red cell glucose content and cells blocking the electrode or enzyme, among other mechanisms. Tested: the regex matches only sim-q234."),
    ('rv-inr-valve-ch9', 'caged-ball aortic.{0,80}INR|Mechanical mitral.{0,60}INR 2\\.5-3\\.5',
     "sim-q360 gives 2.5-3.5 (target 3.0) for mechanical mitral or caged-ball aortic valves. That matches Ch. 39 and the higher 2.5-3.5 range the open sources describe for a mechanical mitral valve or added risk, not Ch. 9's 3-4. The sources read do not mention caged-ball valves specifically. The answer stands."),
    ('rv-mix-incubation-ch9', 'factor VIII autoantibodies are inhibitors and do NOT correct on mixing',
     "sim-q50's answer (full correction = factor deficiency) stands. Its explanation says factor VIII autoantibodies do NOT correct on mixing, but Santoro 2023 says they are usually time-dependent: the immediate mix may correct, and the inhibitor shows only after 2 h at 37 C. sim-q327 already teaches that pattern correctly."),
    ('rv-ch74-pi100-odds', '100\\s*=\\s*99:1|99:1 odds',
     "sim-q653 (the only match; it matches option d and the explanation): answer d (PI 99 is below the threshold, more testing needed) still stands, but the '99:1 odds' and '100 = 99:1' wording is wrong. At a 0.5 prior, PI 100 means odds of 100:1, about 99.0% probability (Thompson 2013; Thelingwani 2024)."),
    ('rv-ch74-pi-threshold', 'AABB (Standards \\(2019\\) )?requires? PI ≥ ?100|required 100',
     'sim-q653 (the only match) presents PI >= 100 as an AABB Standards requirement. Ge & Budowle 2020 report that 65% of AABB-accredited labs used LR 100 for trios in the 2013 annual report, and that thresholds vary (other values such as 10 or 1,000 may be used depending on the relationship). The answer works as an exam convention, but the Standards wording is unverified.'),
    ('rv-turner-karyotype-mix', '45,X occurs in ~50% of cases.*~15% with deletions/rings/Y material',
     "sim-q631's answer (gonadoblastoma risk from Y material) still stands, but its explanation repeats Hit 6's percentages. The 2024 guideline gives 45,X at 40-50%, and a Y chromosome or Y material is detected in 10-12% of individuals with Turner syndrome."),
    ('rv-turner-y-gonadectomy', 'gonadoblastoma risk and warrants gonadectomy',
     'sim-q631 is still answerable, because gonadoblastoma risk from Y material is the main concern. But option c and the explanation say gonadectomy is indicated, while the 2024 guideline (R 7.40) recommends an individualised decision, including timing, and reports gonadoblastoma rates from 0% to 100%. The wording should say gonadectomy is considered case by case.'),
    ('rv-tst-cutoff-groups', 'TST cutoff is 5 mm for HIV-infected persons and close contacts',
     "sim-q534: the answer (6 mm is positive in an HIV-positive close contact) is still correct under CDC guidance. The explanation's lists are incomplete: CDC also puts transplant recipients and other immunosuppressed people at 5 mm, and mycobacteriology lab workers and children under 5 at 10 mm."),
    ('rv-ao-sensitivity', '(?i)acridine orange.{0,80}more sensitive than Gram',
     "sim-q815 (the only match, tested) says acridine orange is more sensitive than the Gram stain for scant organisms and that it detects but does not identify. The keyed answer still stands as a general teaching point: Sharma 2020 found higher AO sensitivity in CSF and cites a detection limit about tenfold lower. But other studies cited there found equivalent or lower AO sensitivity, so 'more sensitive' depends on the study and specimen."),
    ('rv-space-ampc-blanket', 'SPACE organisms carry inducible AmpC that can derepress during therapy',
     "The answer to sim-q521 still stands. The stem is an Enterobacter cloacae bloodstream isolate, the group at highest risk, and Tamma 2019 advises avoiding expanded-spectrum cephalosporins for serious Enterobacter infection even if susceptible (and considering withholding those results). The explanation's blanket 'SPACE organisms' wording should be narrowed: the primer says treatment of the other SPACE organisms can reasonably follow in vitro susceptibility, and that piperacillin-tazobactam is also acceptable on observational data."),
    ('rv-puncture-two-organisms', '[Ss]neaker-sole puncture wound|soles of sneakers',
     'sim-q779 keys Pseudomonas aeruginosa but offers Staphylococcus aureus as a distractor, and Thakolkaran 2019 lists both organisms for puncture wounds. Only the unverified sneaker-sole detail favours P. aeruginosa, so the answer is defensible as the classic association but needs a source before the single keyed answer can be called verified.'),
    ('rv-hct-locus-impact', '10 of 10.*DQB1|DQB1.*five loci',
     "sim-q494 defines a '10 of 10' match as high-resolution A, B, C, DRB1, DQB1. That definition still stands as the term NMDP search reports use, so the keyed answer is fine. The 2019 NMDP/CIBMTR guideline, though, treats 8/8 (A, B, C, DRB1) as the core match standard and says DQB1 has not been shown alone to substantially change survival."),
    ('rv-hit-4t-low-points', 'Low 4T = 0-3% probability|pretest probability is only 0-3%',
     'sim-q362 (matches only this question) treats a low 4T score as a 0-3% probability; in the sources 0-3 is the point range (low band <5%, NPV ~99.8%). Answer d is still the best of the options offered, but its advice to pursue a functional assay conflicts with ASH 2018, which recommends against HIT testing and empiric treatment with a low score.'),
    ('rv-hit-eia-specificity', '~89% specificity|less specific \\(~89%\\)',
     'sim-q362 (matches only this question) quotes ~98%/~89% ELISA performance as fixed values. Sources give >99% sensitivity and specificity that varies with assay type and clinical context (one review cites 40-70%). The point that a weak-positive EIA is not diagnostic still stands.'),
    ('rv-hit-fondaparinux-context', 'fondaparinux \\(no in vivo cross-reactivity\\)',
     "sim-q361 (matches only this question): the answer, that LMWH is contraindicated, stands. The explanation's claim that fondaparinux has no in vivo cross-reactivity goes further than the sources: it is immunogenic but rarely reported as a cause of HIT, and ASH 2018 lists it as a conditional, very-low-certainty option."),
    ('rv-ch35-kappa-lambda-dual', '(?i)normal B cells are kappa OR lambda',
     "Matches only sim-q325 (kappa restriction with an otherwise normal phenotype). Its answer (c) still stands, because clonality alone is not neoplasia (Gajzer & Fromm 2025). Its explanation's wording that normal B cells are 'kappa OR lambda restricted' is loose: a normal population mixes kappa and lambda (about 1.5:1), Pauza 1993 found a small fraction of normal fetal B cells co-expressing both, and Guillory 2016 reports flow restriction without molecular clonality in hematogones."),
    ('rv-mds-eb-ib-terminology', 'MDS-EB2 tops out at 10-19%|at or above 5% with SF3B1 \\(or 15% without\\)',
     'Tested in Python: the regex matches only sim-q307 and sim-q308. Both answers still stand: AML at 25% blasts with normal cytogenetics, and MDS with ring sideroblasts / SF3B1 at 3% blasts. Under WHO 2022, though, EB2 is called MDS-IB2, and the SF3B1 type is defined by the mutation, with >=15% ring sideroblasts as a substitute only when SF3B1 is wild-type. ICC 2022 calls 10-19% blasts MDS/AML and does not require ring sideroblasts for MDS-SF3B1.'),
    ('rv-pt-sdi-warning-zone', 'approximately 2\\.5 threshold',
     "sim-q130 (SDI 3.0 on a passing PT glucose; answer: investigate) still has the right answer. An SDI of 3.0 meets the ISO/IEC 17043 'action signal' limit (|z| >= 3) and would be unsatisfactory in many schemes. The explanation's 'approximately 2.5 threshold' is not a general standard: the sources read put 2-3 in the warning zone and 3 or more as unsatisfactory."),
    ('rv-lot-change-qc-sd', 'changing the SD after a matrix shift',
     "sim-q14 (QC shifts but patients agree after a lot change; answer: adjust the target only, do not change the SD). Adjusting the target is supported by Thompson and Chesher 2018. The sources read do not support an absolute ban on changing the SD: Thompson notes the running mean or SD can change, and ICSH 2024 says IQC targets and limits are assessed for new reagent lots. Option a is defensible as the reviewer's intended best answer, but the explanation overstates the rule."),
    ('rv-ch73-adh1b-direction', 'ADH1B His\\s*→\\s*Arg',
     "sim-q647: the answer (ALDH2 Glu→Lys at 487, loss of function) still stands. But distractor b and the explanation describe ADH1B 'His→Arg at 48' as the gain of function. Edenberg 2007 gives the fast ADH1B*2 allele as Arg48→His48."),
    ('rv-ch73-antidepressant-alt-drug', 'requiring dose adjustments',
     "sim-q648: the answer (d) still stands and already mentions a non-CYP2D6 substrate. The explanation's 'requiring dose adjustments' leaves something out: CPIC 2023 recommends selecting an alternative drug not predominantly metabolized by CYP2D6 for paroxetine and vortioxetine in CYP2D6 ultrarapid metabolizers."),
    ('rv-ch73-dgkh-lithium', 'genome-wide association study of lithium response',
     "sim-q649: the answer (DGKH) still stands, because DGKH encodes diacylglycerol kinase eta in the lithium-sensitive pathway. The stem's premise is wrong, though: Baum 2008 found DGKH in a case-control GWAS of bipolar disorder risk, not a GWAS of lithium response."),
    ('rv-ch32-pbg-quantitative', "Ehrlich's aldehyde screens urinary porphobilinogen",
     'sim-q290 (only match, tested): the answer (PBG deaminase) still stands, because HMBS is also called PBG deaminase (Bissell 2015), and AIP urine is Ehrlich-reactive. The explanation treats the Ehrlich screen as the test. AGA 2023 makes quantitative random urine PBG/ALA normalised to creatinine the initial test, and Aarsand 2025 says a qualitative screen should be followed by a quantitative assay.'),
    ('rv-ch32-zinc-protoporphyrin', 'free erythrocyte protoporphyrin ?(\\(ZPP\\)|/ZPP)',
     "sim-q704 (only match, tested; a Chapter 22 question) treats 'free erythrocyte protoporphyrin' and ZPP as the same thing. Aarsand 2025 separates metal-free protoporphyrin (erythropoietic protoporphyria) from zinc-chelated protoporphyrin, and it is the zinc form that rises in lead poisoning and iron deficiency. The keyed answer (ferrochelatase) was not checked; Bissell 2015 names ALA dehydratase as a lead target, and it is not among the options."),
    ('rv-msafp-peak-timing', 'peak(s|ed)?\\s*(at\\s*)?12\\s*[-–]\\s*14\\s*weeks',
     "sim-q224 (the regex matches only this question): the answer still stands, because a detailed ultrasound is the next step after an elevated MSAFP. Its ~95% anencephaly and 65–80% open-NTD figures agree with Kim 2023 (ACMG 2009 gives ≥95% and 75–90%). The parenthetical 'peak 12-14 weeks' is not supported for maternal serum: Kim 2023 puts the peak in fetal serum at about 9–13 weeks, and the sources disagree on the maternal curve."),
    ('rv-mgus-mspike-threshold', 'IgG threshold suspicious for malignancy',
     "sim-q482: the answer (0.40 x 8.0 = 3.2 g/dL) still stands. The open sources read do not give an 'IgG threshold suspicious for malignancy', and the stem does not state the isotype. A 3.2 g/dL M-protein crosses the IMWG 3 g/dL MGUS fence (smoldering myeloma if there is no damage) and is above the Mayo 1.5 g/dL risk factor."),
    ('rv-mgus-smm-mprotein-fence', 'SLiM biomarker, but multiple myeloma additionally requires',
     "sim-q484: 'Multiple myeloma' is still correctly excluded, because the biomarkers apply only with at least 10% clonal plasma cells (Mateos 2020). 'MGUS' also needs M-protein below 3 g/dL, which the stem does not give, so 'Smoldering myeloma' cannot be ruled out. Abeykoon 2022 also defines light-chain MGUS by an involved:uninvolved FLC ratio below 100, so a ratio of 150 with 8% plasma cells is not a clean MGUS case."),
    ('rv-ch4-coulter-size-windows', 'post-lysis particles (above|larger than|>) ?35 ?fL',
     'Matches only sim-q113. Answer d still stands: after RBC lysis, the large particles counted by an impedance counter are white cells, and pulse height follows cell volume (Bryan 2012; Baccini 2020). The 35 fL cutoff is analyser-specific and no open source read here confirms it, so it should not be taught as a universal value.'),
    ('rv-ch4-ise-indirect', 'indirect ISE dilutes a non-aqueous sample',
     'Matches only sim-q38. Answer c still stands: Aziz 2023 confirms that with very high lipids or proteins, indirect (diluting) ISE gives pseudohyponatremia through the electrolyte exclusion effect, while direct ISE on undiluted sample is not affected.'),
    ('rv-predictive-testing-children-rationale', '(?i)genuine psychosocial harm',
     "sim-q643: the answer (defer predictive Huntington testing of a healthy 10-year-old) still stands. ASHG 2015 gives the child's own future decision as the reason, though, and the limited research it cites found no evidence of significant psychosocial harm. It also names no fixed age such as under 18."),
    ('rv-exome-size-variant-count', '(?i)exome is only ~1\\.5% of the genome',
     'sim-q642: the answer (a negative exome does not exclude a genetic cause) still stands. Clark 2018 gives about two percent of the genome and a pooled exome yield of about 36% in children, which is inside the stated 25-50%. Stitziel 2011 reports typically 15,000-20,000 variants per exome, depending on the target and ancestry.'),
    ('rv-ch6-middleware-las-overlap', 'Middleware performs autoverification, load balancing, and reflex/repeat routing',
     "sim-q117: the answer (middleware) still stands, since none of the other options is a process-control or LIS layer. Armbruster 2014 says 'LAS or middleware' can hold autoverification and repeat/reflex/dilution functions, and Krasowski 2014 says autoverification is commonly done in the LIS and/or middleware, so the explanation should not suggest middleware is the only place these rules can live."),
    ('rv-ch6-open-system-validation', 'Open reagent systems accept third-party reagents',
     'sim-q118: the answer (open reagent system) still stands. Armbruster 2014 adds that the laboratory must perform method validation for every assay it adapts to an open system; in the US, a modified FDA-cleared or non-cleared system needs the lab to establish performance specifications (42 CFR 493.1253(b)(2)).'),
    ('rv-c2-deficiency-figures', 'C2 deficiency \\(1 in 10,000 Caucasians\\)',
     'sim-q498: the answer (C2 deficiency) still stands. Macedo 2016 reports C2 deficiency as the most common deficiency in an ESID registry series of 77 patients. That source gives homozygous prevalence as 1:10,000–20,000 rather than exactly 1 in 10,000.'),
    ('rv-staghorn-not-always-struvite', '(?i)coffin-lid struvite.*staghorn',
     'sim-q251: the answer (struvite infection stone) still stands. Coffin-lid crystals with Proteus in alkaline urine do point to struvite. The explanation should not suggest every staghorn is struvite: Diri 2018 gives 49-68% as infection stones.'),
    ('rv-ethylene-glycol-crystals-absent', '(?i)(calcium oxalate crystalluria plus high anion gap|calcium oxalate crystals identify ethylene glycol|envelope-shaped, birefringent calcium oxalate)',
     'sim-q142 and sim-q250: ethylene glycol is still the right answer. Crystals support the diagnosis but are often absent on admission (1 of 6 in Latus 2012). Lee 2022 names elongated narrow-hexagon monohydrate as the typical form in ethylene glycol poisoning, so the envelope (dihydrate) wording in the q250 stem is not the form that source describes.'),
    ('rv-urine-yeast-contaminant', '(?i)budding ovals with pseudohyphae = Candida',
     "sim-q710: Candida/yeast is still the best answer. The sources read do not support 'budding separates yeast from RBCs', and Poloni 2020 warns that sediment yeast may be a contaminant."),
    ('rv-afp-400-diagnosis', 'AFP >400 ng/mL.{0,40}highly probable HCC',
     'sim-q196 (cirrhotic patient, AFP 450 ng/mL, new 3-cm lesion; keyed answer b). Of the four options, strong suspicion of HCC is still the best reading. However, AASLD 2023 no longer uses AFP to diagnose HCC: the lesion needs multiphase CT or contrast-enhanced MRI (LI-RADS) or pathology, and 400 ng/mL is only a former diagnostic criterion.'),
    ('rv-afp-surveillance-cutoff', 'cirrhosis screening cutoff is 20 ng/mL',
     "sim-q196's explanation also gives 20 ng/mL as the screening cutoff. That matches the AASLD 2023 surveillance data (about 60% sensitive, 90% specific), but APASL 2017 recommends 200 ng/mL with ultrasound, so the number depends on the guideline. The keyed answer is unaffected."),
    ('rv-glucose-na-factor', '1\\.6 x 6',
     'sim-q141 corrects sodium 128 at glucose 700 using only the 1.6 factor (about 138). The Hillier 2.4 factor gives about 142; Hillier also found that above 400 mg/dL even 2.4 underestimates the shift, so the true corrected value may be higher. Answer b (no specific sodium therapy; treat the hyperglycemia) is still the best option. The explanation should describe 1.6 as one of two factors in use, since there is no consensus (Baldrighi 2018).'),
    ('rv-bonferroni-conservative', '(?i)Bonferroni is strictest',
     'Matches only sim-q624 (FDR vs FWER), which calls Bonferroni the strictest family-wise approach. The answer still stands and agrees with the sources, which describe Bonferroni as conservative and false-discovery-rate control as a less strict alternative.'),
    ('rv-ch75-tamoxifen-us-guideline', 'CPIC recommends alternative hormonal therapy for CYP2D6 poor/intermediate metabolizers.*aromatase inhibitors.*Tamoxifen 40 mg/day is only a fallback',
     'Tested in Python against content/question-bank/reviewer-simulator.json: the regex matches exactly one item, sim-q658, whose explanation carries the CPIC 2018 tamoxifen text (alternative hormonal therapy for PM/IM, 40 mg only as a fallback, CYP2D6 inhibitors phenocopy poor-metabolizer status) while its stem asks about paroxetine in a normal metabolizer. The keyed answer (a, paroxetine phenocopies poor-metabolizer status) still stands: Taylor 2020 describes phenoconversion by strong CYP2D6 inhibitors including paroxetine, and Olivera 2019 reproduces the CPIC table to the same effect. The only qualifier is that this is US/international CPIC and FDA-labeled guidance, so Philippine regulatory practice is not covered.'),
    ('rv-hbv-pep-vaccinated-hcp', 'inadequate responders get HBIG \\+ booster',
     "sim-q780: the answer (b) is still the best option. A worker with a completed series and unknown response is tested for anti-HBs, and HBIG is given if the titre is below 10 mIU/mL with an unknown source. ACIP 2018 and CDC 2013 specify HBIG x1 plus starting revaccination (a second series), not a single booster, with the source's HBsAg tested at the same time."),
    ('rv-osha-recap-exception', 'recapping is prohibited',
     'sim-q773: the answer (engineering controls such as safety needles and needleless systems) still stands. Under 29 CFR 1910.1030(d)(2)(vii), recapping is prohibited unless no alternative is feasible or a procedure requires it, and then only one-handed or with a mechanical device.'),
    ('rv-ch57-us-biosafety-scope', 'refer to LRN reference lab|routine closed-specimen (chemistry )?work follows standard precautions',
     "sim-q821 and sim-q772: the answers stand under US frameworks. CDC LRN-B has sentinel labs rule out and refer to reference labs, and the CDC Blue Ribbon Panel guidance puts aerosol and splash work in a BSC. The 'routine closed-specimen work follows standard precautions' half of sim-q772 was not verified (Miller says closed-system analyzers reduce but do not eliminate exposure), and Philippine referral and biosafety rules were not checked."),
    ('rv-csf-bacterial-pattern-gaps', '(?i)low CSF glucose \\+ high protein \\+ neutrophilic pleocytosis|neutrophilic pleocytosis with glucose <40',
     "Matches only sim-q798 and sim-q256 (tested). Both present a case that shows the classic pattern, so their answer (bacterial meningitis) still stands. The sources add that the pattern is often incomplete: in one series low glucose was present in only about half of microbial meningitis (Baud 2018), and findings can be milder early or after antibiotics (Tacon 2012), so the pattern's absence does not exclude the diagnosis."),
    ('rv-tmab-mspike-context', '(?i)daratumumab \\(IgG1-kappa therapeutic antibody\\) forges its own M-spike',
     'sim-q483: the answer (drug band rather than relapse) still stands. Sources add that interference matters mainly at very good partial or complete response when the clone is IgG kappa, that isatuximab also interferes (with its own shift assay), and that DIRA (daratumumab only) or mass spectrometry separates drug from clone.'),
    ('rv-spep-pseudo-band-causes', '(?i)fibrinogen in plasma.{0,40}mimics an M-spike between beta and gamma',
     'sim-q177: the answer stands; Rade 2020 confirms the fibrinogen band lies between beta and gamma and mimics a monoclonal band. Sources also list hemolysis, high CRP and iodinated contrast as pseudo-peak causes.'),
    ('rv-ifob-ugib-context', '(?i)iFOB detects intact human globin.*(insensitive to upper GI|works for upper bleeds)',
     'sim-q31 (melena, suspected upper GI bleed: which FOBT is appropriate) answers guaiac. Analytically that still stands, since gFOBT detects heme from the upper GI tract and FIT largely misses it. But Salisbury 2021 and Méndez 2025 state that stool occult blood testing is not validated for diagnosing acute upper GI bleeding, so the explanation should add that melena needs clinical assessment and endoscopy.'),
    ('rv-ch78-crc-braf-combination', 'BRAF mutation is an additional resistance marker',
     "sim-q662 (BRAF V600E-mutant, RAS wild-type mCRC; cetuximab considered): option b is still the best of the four choices, but 'anti-EGFR therapy is unlikely to benefit' goes too far. Kanat 2020 describes BEACON, where cetuximab combined with encorafenib (with or without binimetinib) is a second- or third-line option for BRAF-mutant mCRC. This adds to the existing rv-crc-braf-predictive note on the same question (Sepulveda 2017: insufficient evidence for BRAF as an anti-EGFR predictive marker). The regex was tested and matches only sim-q662."),
    ('rv-tma-nasba-denaturation', 'TMA and NASBA need no initial denaturation',
     'Matches only sim-q618 (tested). The keyed answer still stands against its distractors: a 95 °C DNA-strand-separation step is not part of TMA/NASBA. The explanation goes too far, though. Obande 2020 describes an initial ~65 °C RNA denaturation step in NASBA, and Dunbar 2019 lists a commercial TMA assay for hepatitis B virus, so it should say there is no DNA-melting step rather than no denaturation at all, and that DNA cannot interfere in every case.'),
    ('rv-cmv-ul54-crossres', 'UL56 mutation with wild-type UL97',
     'sim-q582: answer d (UL56 means letermovir resistance, not ganciclovir resistance) still stands. Kotton 2025 says genotyping should routinely include both UL97 and UL54, and that UL54 mutations may uncommonly be the first one detected. So when UL97 is wild type, UL54 should be checked to explain ganciclovir failure. Letermovir resistance often involves UL56 codon 325, and low-grade mutations also occur in UL51/UL89.'),
    ('rv-ch58-ea-m52', 'CLSI M52 requires at least 90% essential agreement',
     'sim-q530 (the only match in the bank; tested): the answer (88% EA fails) still stands, because the CLSI working group best practices (Humphries 2018) set EA at 90% or more, within one doubling dilution. The paper covers method evaluation in general, and the attribution of this figure to M52 itself could not be checked from open text.'),
    ('rv-perls-grade-scale', '(?i)Perls grades marrow iron 0-5\\+|2\\+ is normal adult storage iron',
     "Matches only sim-q275, which keys 2+ as normal adult storage iron on a 0–5+ scale. The open sources read use other scales: Gale 0–6, where 0–1 is deficient, grade 2 is 'slight' and 2 or more counts as positive fragment iron; or none/low/normal/abundant. They report no standardised method. 'Not absent or deficient' still holds against the distractors, but 'normal 2+' depends on the scale."),
    ('rv-leukoerythroblastic-causes', '(?i)Leukoerythroblastosis signals a marrow space-occupying process',
     'Matches only sim-q277. Its answer (a marrow space-occupying process) is still the best option, since infiltration and myelofibrosis are major causes. Langabeer 2025 also lists reactive causes (haemolysis, liver disease, haemorrhage, megaloblastic anaemia, acute infection), so the explanation should not suggest infiltration is the only cause.'),
    ('rv-vitd-target-guideline', 'deficient <20 ng/mL, target ~30',
     "sim-q228's answer (measure 25(OH)D, not 1,25(OH)2D) still stands. Its explanation states 'target ~30' as fact, but the target depends on the guideline: Pilz 2019 reports that the 2011 Endocrine Society guideline treats to at least 75 nmol/L (30 ng/mL), while the IOM sees no added benefit over 50 nmol/L (20 ng/mL)."),
    ('rv-arni-bnp-modest', 'only honest marker on this drug|neprilysin inhibition blocks BNP breakdown, falsely raising it',
     "sim-q172: answer c (follow NT-proBNP) still stands, since Castiglione 2022 calls NT-proBNP the biomarker of choice on sacubitril/valsartan. However, 'only honest marker' and 'falsely raising' overstate it. In PARADIGM-HF the median BNP rose only 19%, much less than the stem's 220 to 480 rise, and Nishikimi 2022 argues BNP remains usable."),
    ('rv-mpn-triple-negative', 'together account for >95% of Philadelphia-negative',
     'Tested in Python: the regex matches only sim-q671. The answer (CALR next after a negative JAK2 V617F in suspected ET) still stands. Luque Paz 2023 reports that about 10% of MPN patients are triple-negative, so the three drivers do not cover >95%, and a negative panel does not exclude ET.'),
    ('rv-sf3b1-rs-threshold', '[Rr]ing sideroblasts at or above 5% with SF3B1',
     "Tested in Python: the regex matches only sim-q308, which already carries a note under rv-mds-eb-ib-terminology. The answer (MDS with ring sideroblasts) still stands; WHO 2022 lists 'MDS with low blasts and ring sideroblasts' as acceptable terminology. The explanation, however, gives the WHO 2016 rule. WHO 2022 defines MDS-SF3B1 by the mutation, with >=15% ring sideroblasts only as a substitute, and ICC 2022 requires SF3B1 VAF >=10% with no ring-sideroblast requirement."),
    ('rv-taenia-egg-size-range', 'Taenia species eggs \\(31-43',
     "sim-q592: the answer (report 'Taenia spp.') still stands, because CDC DPDx says all Taenia eggs are morphologically identical. The 31–43 μm size in the option text differs from CDC's 30–35 μm."),
    ('rv-haematobium-urine-window', 'haematobium.{0,80}10 am and 2 pm',
     'sim-q591: the answer (S. haematobium, terminal spine) stands, and the 10 am–2 pm window matches Gray 2011 and Ponzo 2024. CDC DPDx gives noon–3 pm instead, so the exact window depends on the source.'),
    ('rv-pinworm-stool-yield-figure', 'detects only 5.10% of Enterobius',
     "sim-q85: the answer (morning perianal tape) stands and is supported by CDC DPDx and Wendt 2019. The '5–10%' stool figure in the explanation was not found in the sources read; they say only that eggs appear in stool less often."),
    ('rv-lyme-early-sensitivity', 'two-tier Lyme serology is only 40[-–]60% sensitive in early disease',
     "sim-q556: the answer still stands, because erythema migrans with tick exposure is a clinical diagnosis. The 40-60% figure is higher than the CDC review's 30-40% early sensitivity (Moore 2016; acute-phase table values 38-42%) and Branda & Steere 2021's 14% in solitary EM. The figure depends on assay, stage and sampling time."),
    ('rv-natalizumab-alpha4-chain', 'Vedolizumab \\(gut-selective anti-alpha4/beta7\\) avoids the PML risk',
     "Matches only sim-q490 (tested). The answer (vedolizumab) still stands. 'Avoids the PML risk' goes further than the sources: Colombel 2017 and Card 2018 report no PML cases in the clinical programme up to 2018, and Card estimates the risk is small (unlikely above 6.75 per 100,000 patient-years) rather than absent."),
    ('rv-mets-cutoffs-guideline', '(?i)metabolic syndrome criteria|any 3 of 5 defines metabolic syndrome',
     'Tested in Python: the regex matches only sim-q167 (waist 106 cm, TG 185, HDL 36, BP 138/88, FPG 108). All five criteria are still met under every definition checked: waist exceeds 102, 94 and 90 cm, TG 185 meets both >=150 and the 2018 AHA/ACC >175 tally, HDL <40, BP >=130/85 and FPG >=100. The keyed answer (5 of 5) stands.'),
    ('rv-paget-alp-calcium', '(?i)elevated ALP with normal calcium and phosphate is Paget',
     'The answer to sim-q151 (Paget disease) still stands: very high ALP with normal calcium, skull enlargement and hearing loss fits Paget disease. Sources add that total ALP can be normal in limited or monostotic disease. Hypercalcemia in a Paget patient can come from immobilization, so it does not always point to hyperparathyroidism or malignancy.'),
    ('rv-osteomalacia-calcium', '(?i)Low vitamin D with low Ca/phosphate and high ALP is defective mineralization',
     'The answer to sim-q152 (osteomalacia) still stands. Calcium can be low, as in this stem, but in vitamin D deficiency secondary hyperparathyroidism often keeps it normal, so low calcium is not required for the diagnosis. Osteomalacia can also lower BMD, so the T-score does not separate the two conditions on its own.'),
    ('rv-aom-hflu-settings', 'most common bacterial cause of acute otitis media',
     'Question sim-q799 keys S. pneumoniae as the most common bacterial cause of acute otitis media. That answer still stands for most reports. The explanation should note that Haemophilus influenzae predominates in chronic otitis media with effusion, recurrent disease and treatment failure, and that after PCV7 it overtook pneumococcus in acute otitis media in several countries (Ngo 2016).'),
    ('rv-no-growth-not-atypical', 'no dominant routine-culture organism\\s*=\\s*atypical pneumonia',
     'Question sim-q800 keys an atypical pathogen not recovered on routine culture. That remains the best of the options offered. The explanation overstates the finding as proof: at least half of pneumonia episodes never get a cause, and atypicals must be sought with NAAT, Legionella urinary antigen or BCYE culture (Garin 2022; Baron 2013).'),
    ('rv-cf-bcc-selective-media', '[Ff]ruity[- ]odor oxidase-positive nonfermenter in CF',
     'Question sim-q801 keys Pseudomonas aeruginosa for a grape-smelling oxidase-positive nonfermenter in cystic fibrosis sputum. The answer stands: the odour compound 2-aminoacetophenone was specific to P. aeruginosa in vitro (Scott-Thomas 2010). The explanation could add that oxidase is shared by most nonfermenters and that Burkholderia cepacia complex needs selective agar (Behzadi 2021; Baron 2013).'),
    ('rv-maldi-close-species', 'MALDI-TOF requires a pure isolate|identifies pure colonies in hours',
     'sim-q806 (keyed b, pure isolate) and sim-q119 (chapter 6, MALDI performance) both keep their answers. Their explanations omit that closely related species are not separated even in pure culture (S. pneumoniae vs S. mitis/oralis, E. coli vs Shigella). In sim-q806, distractor a is false as a general statement but is partly true for those species pairs (Calderaro 2024).'),
    ('rv-novobiocin-not-unique', '(?i)novobiocin-resistant\\s+CoNS|novobiocin-resistant\\s+coagulase-negative',
     'sim-q75 (young woman, UTI, novobiocin-resistant CoNS; options S. epidermidis, S. lugdunensis, S. haemolyticus, S. saprophyticus): the answer S. saprophyticus still stands, because the other three options are novobiocin-susceptible (De Paulis 2003 Table 1). However, the S. cohnii group and S. hominis subsp. novobiosepticus are also resistant, so resistance is presumptive rather than unique to S. saprophyticus. Tested: the regex matches only sim-q75 in the bank.'),
    ('rv-cellular-lithium-heparin', 'lithium heparin and EDTA are forbidden',
     "sim-q480 (blastogenesis and NK cytotoxicity tube): sodium heparin is still the most defensible option, since heparin is preferred over EDTA for cytokine work (Cossarizza 2021). The explanation's 'lithium heparin is forbidden' is too absolute: several validated IGRA and ELISpot methods collect in lithium heparin. No source read addresses tubes for blastogenesis or NK cytotoxicity specifically, and 'preservative-free' is unverified."),
    ('rv-fever-restart', r'(rise|rises|increase)[^.]{0,30}(≥|>=)? ?1(\.\d)? ?°?C|(≥|>=) ?1 ?°?C',
     'The ≥ 1 °C trigger was not found in the sources checked; WHO 2001 allows a slow restart with a new unit if the patient improves. Stopping and ruling out hemolysis and bacterial contamination is supported.'),
    ('rv-mchc-only', r'MCHC[^.]{0,80}(spherocyt|only)|spherocyt[^.]{0,80}MCHC',
     'Spherocytosis is the classic true cause of a high MCHC, but not the only one: xerocytosis also raises it, and cold agglutinins or interference raise it spuriously. A high MCHC detects only a minority of spherocytosis cases.'),
    ('rv-fena-cutoff', r'>\s?1\s?%[^.]{0,40}(ATN|tubular)|(ATN|tubular necrosis)[^.]{0,40}>\s?1\s?%',
     'A 2025 consensus treats FENa 1–2% as indeterminate and > 2% as intrinsic (e.g. ATN); diuretics raise FENa even in prerenal states.'),
    ('rv-bc-yield', r'(80|96) ?%[^.]{0,60}bacter|detect[^.]{0,30}(80|96) ?%',
     'Lee 2007 found one to four blood cultures detected 73%, 90%, 98% and 99.8% of bloodstream infections; 80/96% comes from a 2004 study.'),
    ('rv-bc-interval', r'30.{0,3}60 ?min',
     'CDC guidance says at least two sets within a few hours from separate sites; no fixed 30–60-minute interval was found.'),
    ('rv-hbv-chronicity', r'(80|90) ?%[^.]{0,60}(neonat|infant)|(1.2|1–2|1-2) ?%[^.]{0,40}adult',
     'CDC (2025): about 90% of infected infants, 30% of children infected at 1–5 years and about 5% of adults develop chronic hepatitis B.'),
    ('rv-leukemia-blasts', r'blasts?[^.]{0,60}(20|30) ?%|(20|30) ?%[^.]{0,60}blasts?',
     'Blast thresholds differ between WHO-HAEM5 and ICC 2022 classifications; check which system the question assumes.'),
]


# Rules whose issue is not specific to the chapter the flag was found in.
ANY_CHAPTER = {'rv-biotin-fda', 'rv-fvl-risk', 'rv-calcium-ref-albumin'}


def text(el):
    return re.sub(r'\s+', ' ', ''.join(el.itertext())).strip()


def main(oebps: str, out: str):
    sim = ET.parse(Path(oebps) / 'chap-examsim.xhtml').getroot()
    key = ET.parse(Path(oebps) / 'chap-examkey.xhtml').getroot()
    qdivs = sim.findall('.//h:div[@class="q"]', NS)
    keys = key.findall('.//h:body/h:ol/h:li', NS)
    assert len(qdivs) == len(keys), (len(qdivs), len(keys))

    curriculum = json.loads((ROOT / 'content/curriculum.json').read_text())
    topic_by_chapter = {}
    for d in curriculum['domains']:
        for t in d['topics']:
            if t.get('reviewerChapter'):
                topic_by_chapter[t['reviewerChapter']] = (d['id'], t['id'])
    flags = {f['id']: f for f in json.loads((ROOT / 'content/reviewer-review.json').read_text())['flags']}

    questions = []
    for i, (qd, kl) in enumerate(zip(qdivs, keys), start=1):
        p = qd.find('h:p', NS)
        tag = p.find('h:span[@class="qtag"]', NS)
        ch = int(re.fullmatch(r'Ch\. (\d+)', tag.text.strip()).group(1))
        full = text(p)
        stem = re.sub(rf'^Q{i}\.\s*Ch\. {ch}\s*', '', full).strip()
        assert stem and not re.match(r'Q\d+\.', stem), (i, full[:60])
        opts = [text(li) for li in qd.findall('h:ol/h:li', NS)]
        assert len(opts) == 4, i
        letter = kl.find('h:strong', NS).text.strip()
        expl = re.sub(r'^[A-D]\s*[—-]\s*', '', text(kl)).strip()
        domain, topic = topic_by_chapter[ch]
        blob = ' '.join([stem, *opts, expl])
        notes = [{'flagId': fid, 'note': note} for fid, rx, note in FLAG_RULES
                 if fid in flags and flags[fid]['status'] != 'resolved'
                 and (flags[fid]['location']['chapter'] in (ch, 0) or fid in ANY_CHAPTER) and re.search(rx, blob, re.I)]
        questions.append({
            'id': f'sim-q{i}',
            'number': i,
            'chapter': ch,
            'domain': domain,
            'topic': topic,
            'stem': stem,
            'options': [{'id': 'abcd'[j], 'text': o} for j, o in enumerate(opts)],
            'answer': letter.lower(),
            'explanation': expl,
            'notes': notes,
        })

    bank = {
        'id': 'reviewer-simulator',
        'title': 'Reviewer Exam Simulator',
        'source': 'Almoradie A. MEMORY LAB: The Memory-First Medical Laboratory Science Reviewer. 1st ed., v2.0. 2026. Exam Simulator and Answer Key.',
        'permission': 'Imported at the request of the user, who stated on 2026-10-07 that they hold the rights to the reviewer.',
        'verification': 'Questions, answers and explanations are the reviewer’s own and have not been verified by this app or by a human expert. Notes link known problems to the reviewer accuracy register; a question without a note is not thereby verified.',
        'importedAt': '2026-10-07',
        'count': len(questions),
        'questions': questions,
    }
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    Path(out).write_text(json.dumps(bank, ensure_ascii=False, indent=1) + '\n')
    n_notes = sum(1 for q in questions if q['notes'])
    print(f'wrote {out}: {len(questions)} questions, {n_notes} with register notes')


if __name__ == '__main__':
    main(*sys.argv[1:3])
