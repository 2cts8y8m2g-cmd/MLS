"""Builds content/curriculum.json and content/reviewer.json from the reviewer extraction.

Usage:
  python3 scripts/reviewer/extract_epub.py <OEBPS dir> source/reviewer-extract.json
  python3 scripts/reviewer/build_curriculum.py source/reviewer-extract.json

What gets committed is an *inventory*: short concept labels auto-derived from the
reviewer's bolded lead phrases (clipped at the first clause break), locators
(chapter / section / item), counts and tags. The reviewer's full text stays in
source/ (git-ignored).

Concept model per chapter (topic):
  core    High-Yield Hit #1 (the book: "the first bullet is always the core concept")
  hit     High-Yield Hits #2..n
  table   each table (Number Vault and comparison tables)
  figure  the chapter illustration + caption
  trap    each Exam Trap (trap/dodge pair)
  special "Do Not Confuse" / "Calculation Check" sections
Memory Hooks and 5-Second Recall are counted per chapter but are study devices for
existing concepts rather than new concepts, so they are not separate concepts.
"""
import json, re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
data = json.loads(pathlib.Path(sys.argv[1]).read_text(encoding='utf-8'))
BOTH = ['ascp', 'mtle']

PART_DOMAINS = {
    'I': ('p1-ops', 'Lab Operations', 'QC, safety, preanalytics, instrumentation, statistics, informatics, management, ethics'),
    'II': ('p2-chem', 'Clinical Chemistry', None),
    'III': ('p3-cm', 'Clinical Microscopy (Urinalysis & Body Fluids)', None),
    'IV': ('p4-heme', 'Hematology & Hemostasis', None),
    'V': ('p5-bb', 'Blood Banking (Immunohematology & Transfusion)', None),
    'VI': ('p6-immuno', 'Immunology & Serology', None),
    'VII': ('p7-micro', 'Microbiology (incl. Parasitology, Mycology, Virology)', None),
    'VIII': ('p8-mdx', 'Molecular Diagnostics', None),
}

# Cross-chapter prerequisites (core concept → core concepts it builds on). Within a Part,
# each chapter's core also builds on the previous chapter's core (the book's order).
CROSS = {
    40: [44, 47],   # blood groups ← immune overview, humoral immunity (antibody structure)
    41: [40],
    45: [44],
    61: [45],       # syphilis serology ← immunoassays
    64: [45, 69],   # viral testing ← immunoassays, PCR
    35: [31],
    77: [34, 69],   # molecular heme malignancy ← WBC disorders, PCR
    11: [10],
    17: [10],
    15: [4],        # renal/electrolytes ← analyzers (ISE)
    58: [57],
}

# Hand-set prerequisites that replace the default "hit → chapter core" rule where that
# rule is pedagogically wrong (e.g. ABO typing does not depend on DAT vs IAT).
OVERRIDES = {
    'ch40.hit2': ['ch47.hit1'],   # ABO forward/reverse ← immunoglobulin classes (IgM)
    'ch40.hit13': ['ch40.hit2'],  # Bombay ← ABO typing
    'ch40.hit14': ['ch40.hit2'],  # discrepancy groups ← ABO typing
    'ch40.hit22': ['ch40.hit2', 'ch47.hit1'],
    'ch40.hit26': ['ch40.hit2'],
    'ch40.trap6': ['ch40.hit14'],
}

# Subjects an exam track needs that the reviewer does not cover. Kept, but flagged.
GAPS = [
    ('gap-histo', 'Histopathologic & Cytologic Techniques', ['mtle'],
     'Not covered by the reviewer. Part of the PH MTLE sixth subject (R.A. 5527 Sec. 17: Histopathologic Technique, 10%).',
     [('fixation', 'Fixation and fixatives'), ('processing', 'Tissue processing: dehydration, clearing, infiltration, embedding'),
      ('microtomy', 'Microtomy and sectioning artifacts'), ('he', 'H&E staining'), ('special-stains', 'Special stains'),
      ('pap', 'Papanicolaou staining and cytologic preparation')]),
    ('gap-ph-law', 'Philippine Medical Technology Laws & Ethics', ['mtle'],
     'Not covered by the reviewer (Ch. 14 covers ethics generally and Ch. 1/13 cover US regulation such as CLIA and Medicare billing). PH MTLE scope per secondary sources — unverified pending Annex A of PRB-MT Res. 13 s. 2023.',
     [('ra-5527', 'R.A. 5527: Philippine Medical Technology Act'), ('related-laws', 'Related PH laws and implementing rules (clinical laboratory licensing, blood services, HIV, dangerous drugs)'),
      ('ph-code-of-ethics', 'Code of ethics for Filipino medical technologists'), ('ph-lab-regulation', 'DOH licensing and classification of clinical laboratories')]),
    ('gap-ascp-edu', 'Education Principles (ASCP Laboratory Operations)', ['ascp'],
     'Not covered by the reviewer. Listed under ASCP Laboratory Operations by secondary sources (unverified).',
     [('education-principles', 'Education principles, competency assessment and training')]),
]

SEPS = [' — ', ' – ', '; ', ': ', ' (', ' → ', '. ', ', which', ' = ']
# A clipped label must not end on a word that needs what follows it.
DANGLING = re.compile(r'\b(requires?|is|are|was|were|means?|includes?|needs?|uses?|has|have|of|the|a|an|to|for|with|by|in|on|at|vs|and|or|than|from|into)$', re.I)


def clip(s, limit=96):
    s = re.sub(r'\s+', ' ', s).strip().replace('"', '').replace('“', '').replace('”', '')
    cuts = sorted(i for sep in SEPS for i in [s.find(sep)] if i >= 12)
    out = s
    for i in cuts:
        cand = s[:i].rstrip(' ,.;:')
        if not DANGLING.search(cand):
            out = cand
            break
    if len(out) > limit:
        out = out[:limit].rsplit(' ', 1)[0].rstrip(' ,.;:')
        while DANGLING.search(out) and ' ' in out:
            out = out.rsplit(' ', 1)[0]
        out += '…'
    return out


def trunc(s, limit):
    s = re.sub(r'\s+', ' ', s).strip()
    return s if len(s) <= limit else s[:limit].rsplit(' ', 1)[0].rstrip(' ,;:') + '…'


def label_hit(h):
    lead = h.get('lead')
    base = lead if lead and 3 <= len(lead) <= 140 else h['text']
    return clip(base)


domains = {}
reviewer_chapters = []
prev_core_in_part = {}
for c in data['chapters']:
    n = c['n']
    did, dtitle, _ = PART_DOMAINS[c['part']]
    dom = domains.setdefault(did, {'id': did, 'title': dtitle, 'tracks': BOTH, 'sequence': list(PART_DOMAINS).index(c['part']) + 1,
                                   'reviewerPart': c['part'], 'topics': []})
    tid = f'ch{n}'
    core_id = f'{tid}.hit1'
    concepts = []
    for i, h in enumerate(c['hits'], 1):
        if i == 1:
            pre = []
            if c['part'] in prev_core_in_part:
                pre.append(prev_core_in_part[c['part']])
            pre += [f'ch{x}.hit1' for x in CROSS.get(n, [])]
        else:
            pre = [core_id]
        concepts.append({'id': f'{tid}.hit{i}', 'title': label_hit(h), 'kind': 'core' if i == 1 else 'hit', 'tracks': BOTH,
                         'prerequisites': sorted(set(pre)), 'skills': h['tags'] or None,
                         'reviewerRef': {'chapter': n, 'section': 'High-Yield Hits', 'items': [i]}})
    for ti, tb in enumerate(c['tables'], 1):
        first = [next((x for x in r if x), '') for r in tb['rows'] if any(r)][:3]
        name = 'Number Vault' if ti == 1 else f'Table {ti}'
        concepts.append({'id': f'{tid}.table{ti}', 'title': trunc(f"{name}: {', '.join(first)}" + (', …' if len(tb['rows']) > 3 else ''), 120),
                         'kind': 'table', 'tracks': BOTH, 'prerequisites': [core_id],
                         'reviewerRef': {'chapter': n, 'section': 'Number Vault' if ti == 1 else 'Table', 'items': [ti]},
                         'notes': f"{len(tb['rows'])} rows; columns: {', '.join(tb['head'])}"})
    if c['figure']['caption']:
        cap = re.sub(r'^Figure \d+\s*[—-]\s*', '', c['figure']['caption'])
        concepts.append({'id': f'{tid}.figure', 'title': 'Figure: ' + clip(cap), 'kind': 'figure', 'tracks': BOTH, 'prerequisites': [core_id],
                         'reviewerRef': {'chapter': n, 'section': 'Figure'},
                         'notes': 'Reviewer illustration (not reused in the app; app visuals are original).'})
    for i, tr in enumerate(c['traps'], 1):
        concepts.append({'id': f'{tid}.trap{i}', 'title': 'Trap: ' + clip(tr['trap']), 'kind': 'trap', 'tracks': BOTH, 'prerequisites': [core_id],
                         'reviewerRef': {'chapter': n, 'section': 'Exam Traps', 'items': [i]}})
    for i, (sname, _) in enumerate(c['extraSections'].items(), 1):
        concepts.append({'id': f'{tid}.special{i}', 'title': sname, 'kind': 'special', 'tracks': BOTH, 'prerequisites': [core_id],
                         'reviewerRef': {'chapter': n, 'section': sname}})
    for k in concepts:
        if k['id'] in OVERRIDES:
            k['prerequisites'] = OVERRIDES[k['id']]
        if not k.get('skills'):
            k.pop('skills', None)
    dom['topics'].append({'id': tid, 'title': f"Ch. {n} · {c['title'].title().replace(' And ', ' and ').replace(' Of ', ' of ').replace(' The ', ' the ').replace(' To ', ' to ')}",
                          'reviewerChapter': n, 'simulatorQuestions': c['simulatorQuestions'], 'concepts': concepts})
    prev_core_in_part[c['part']] = core_id
    reviewer_chapters.append({
        'id': tid, 'n': n, 'title': c['title'], 'part': c['part'], 'partTitle': c['partTitle'], 'sections': c['sections'],
        'counts': {'highYield': len(c['hits']), 'memoryHooks': len(c['hooks']), 'tableRows': sum(len(t['rows']) for t in c['tables']),
                   'tables': len(c['tables']), 'figures': 1 if c['figure']['caption'] else 0, 'traps': len(c['traps']),
                   'recall': len(c['recall']), 'special': len(c['extraSections']), 'simulatorQuestions': c['simulatorQuestions']},
        'status': 'inventoried'})

out_domains = sorted(domains.values(), key=lambda d: d['sequence'])
for gi, (gid, gtitle, gtracks, gnote, items) in enumerate(GAPS):
    out_domains.append({'id': gid, 'title': gtitle, 'tracks': gtracks, 'sequence': 9 + gi, 'reviewerPart': None, 'notes': gnote,
                        'topics': [{'id': f'{gid}.t', 'title': f'{gtitle} (not in reviewer)', 'concepts': [
                            {'id': f'{gid}.{cid}', 'title': t, 'kind': 'gap', 'tracks': gtracks, 'prerequisites': [], 'reviewerRef': None,
                             'notes': 'Not in the reviewer — needs an additional source.'} for cid, t in items]}]})

total = sum(len(t['concepts']) for d in out_domains for t in d['topics'])
curriculum = {
    'provenance': {
        'status': 'reviewer-derived',
        'statement': ("Derived from the user's reviewer, MEMORY LAB: The Memory-First Medical Laboratory Science Reviewer "
                      "(A. Almoradie, 1st ed., v2.0, 2026; EPUB). Domains are the reviewer's 8 Parts, topics are its 79 chapters, and "
                      "concepts are its High-Yield Hits, tables, figures, Exam Traps and special sections, located by chapter/section/item "
                      "(the EPUB has no fixed page numbers). Three extra domains list exam-track subjects the reviewer does not cover."),
        'labelNote': 'Concept labels are auto-derived from the reviewer\'s bolded lead phrases, clipped at the first clause break; they are index labels, not teaching text.',
        'revisedAt': '2026-10-07',
    },
    'domains': out_domains,
}
(ROOT / 'content/curriculum.json').write_text(json.dumps(curriculum, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')

reviewer = {
    'received': True,
    'fileName': 'MEMORY-LAB_Final_2_Epub.epub',
    'title': 'MEMORY LAB: The Memory-First Medical Laboratory Science Reviewer',
    'author': 'Anthony Almoradie',
    'edition': 'First Edition — Version 2.0 — 2026 (scientific review cutoff 2026-09-28)',
    'format': 'EPUB 3 (reflowable), 220,222 words, 80 images',
    'pagesAccessible': 'All content documents were readable: front matter, How to Use, Chapters 1–79, Lightning Round, Exam Simulator (828 questions) and Answer Key, Appendices, Index, About the Author.',
    'hasPageNumbers': False,
    'statement': ("Received 2026-10-07 and fully inventoried. The EPUB is reflowable and contains no page-break markers (its own index notes that page numbers differ on e-readers), "
                  "so every mapping uses chapter → section → item. The three fixed-form mock exams referenced by the book are separate PDFs and were not provided."),
    'backMatter': [
        {'name': 'Lightning Round', 'description': '100 most-tested facts (1–79 are the chapter core concepts)', 'usedInApp': 'Not imported; chapter core concepts are inventoried directly.'},
        {'name': 'Exam Simulator + Answer Key', 'description': '828 chapter-tagged questions with explanations', 'usedInApp': 'Only per-chapter question counts are recorded. Questions are not copied into the app (proprietary question bank); app questions are original.'},
        {'name': 'Appendix A — ASCP blueprint map', 'description': 'Maps Parts/chapters to ASCP BOC areas; states 17–22% / 5–10% weights', 'usedInApp': 'Used for track mapping; weights still flagged unverified against the official ASCP PDF.'},
        {'name': 'Appendix B — Bibliography', 'description': 'Guidelines and references cited by the book', 'usedInApp': 'Used to locate sources for verification; edition currency flagged in docs/ACCURACY.md.'},
        {'name': 'Mock exams 1–3 (PDF)', 'description': 'Referenced but not included in the EPUB', 'usedInApp': 'Not received.'},
    ],
    'selfReportedReview': ("The reviewer's release record states a 1,594-point fact-verification register (1,558 confirmed, 14 corrected, 22 flagged for human review), "
                           "AI-assisted specialist screening, and NO independent human specialist review or real learner testing. "
                           "MEMORY LAB (the app) treats the reviewer as the curriculum foundation, not as an authority."),
    'chapters': reviewer_chapters,
}
(ROOT / 'content/reviewer.json').write_text(json.dumps(reviewer, indent=1, ensure_ascii=False) + '\n', encoding='utf-8')
kinds = {}
for d in out_domains:
    for t in d['topics']:
        for k in t['concepts']:
            kinds[k['kind']] = kinds.get(k['kind'], 0) + 1
print(f'{len(out_domains)} domains, {sum(len(d["topics"]) for d in out_domains)} topics, {total} concepts', kinds)
