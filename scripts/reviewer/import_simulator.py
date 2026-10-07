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
