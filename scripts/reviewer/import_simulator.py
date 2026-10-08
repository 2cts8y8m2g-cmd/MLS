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
ANY_CHAPTER = {'rv-biotin-fda'}


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
