"""Structured extraction of the MEMORY LAB reviewer EPUB.

Usage: python3 scripts/reviewer/extract_epub.py <unzipped EPUB OEBPS dir> <output.json>

The output contains the reviewer's full text and must NOT be committed (the book is
copyrighted). Write it under source/ (git-ignored). build_curriculum.py turns it into
the committed inventory, which holds only short labels, locators and counts.
"""
import re, html, sys, json, pathlib
OE = pathlib.Path(sys.argv[1]); OUT = pathlib.Path(sys.argv[2])

def txt(s):
    s = re.sub(r'<br\s*/?>', ' ', s)
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', s))).strip()

def sections(t):
    parts = re.split(r'<h2>(.*?)</h2>', t, flags=re.S)
    return {txt(parts[i]): parts[i + 1] for i in range(1, len(parts) - 1, 2)}

def lis(block):
    return re.findall(r'<li>(.*?)</li>', block, re.S)

PARTS = [(1, 14, 'I', 'Lab Operations'), (15, 28, 'II', 'Clinical Chemistry'), (29, 30, 'III', 'Clinical Microscopy'),
         (31, 39, 'IV', 'Hematology & Hemostasis'), (40, 43, 'V', 'Blood Banking'), (44, 56, 'VI', 'Immunology'),
         (57, 66, 'VII', 'Microbiology'), (67, 79, 'VIII', 'Molecular Diagnostics')]
# Part boundaries confirmed from the book's PART headings. Ch. 9 sits in Part I but the
# book's Appendix A maps it to the Chemistry blueprint area.

chapters = []
for n in range(1, 80):
    t = (OE / f'chap{n}.xhtml').read_text(encoding='utf-8')
    title = txt(re.search(r'<span class="chtitle">(.*?)</span>', t, re.S).group(1))
    fig = re.search(r'<figcaption[^>]*>(.*?)</figcaption>', t, re.S)
    img = re.search(r'<img[^>]*src="([^"]+)"', t)
    sec = sections(t)
    names = list(sec.keys())
    hits = []
    for li in lis(sec.get('High-Yield Hits', '')):
        tags = re.findall(r'\[(interpret|calculate|recall|apply|analyze|compare)\]', li)
        hits.append({'html': li, 'text': txt(re.sub(r'\[(interpret|calculate|recall|apply|analyze|compare)\]', '', li)), 'tags': tags,
                     'lead': txt(m.group(1)) if (m := re.match(r'\s*<strong>(.*?)</strong>', li, re.S)) else None})
    hooks = [{'text': txt(li), 'lead': txt(m.group(1)) if (m := re.match(r'\s*<strong>(.*?)</strong>', li, re.S)) else None} for li in lis(sec.get('Memory Hooks', ''))]
    vault_html = sec.get('Number Vault', '')
    tables = []
    for tb in re.findall(r'<table>(.*?)</table>', t, re.S):
        head = [txt(h) for h in re.findall(r'<th[^>]*>(.*?)</th>', tb, re.S)]
        rows = [[txt(c) for c in re.findall(r'<td[^>]*>(.*?)</td>', r, re.S)] for r in re.findall(r'<tr>(.*?)</tr>', tb, re.S)]
        rows = [r for r in rows if r]
        tables.append({'head': head, 'rows': rows})
    vault_paras = [txt(p) for p in re.findall(r'<p>(.*?)</p>', re.sub(r'<table>.*?</table>', '', vault_html, flags=re.S), re.S)]
    traps = []
    for p in re.findall(r'<p>(.*?)</p>', sec.get('Exam Traps', ''), re.S):
        s = txt(p)
        m = re.match(r'Trap:\s*(.*?)\s*Dodge:\s*(.*)', s)
        traps.append({'trap': m.group(1), 'dodge': m.group(2)} if m else {'trap': s, 'dodge': ''})
    recall = [{'q': txt(q).removeprefix('Q:').strip(), 'a': txt(a)} for q, a in re.findall(r'<p class="rq">(.*?)</p>\s*<p class="ra">(.*?)</p>', t, re.S)]
    # any other narrative paragraphs / h3 notes outside standard sections
    extra = {k: txt(v)[:200] for k, v in sec.items() if k not in ('The Big Picture', 'High-Yield Hits', 'Memory Hooks', 'Number Vault', 'Exam Traps', '5-Second Recall')}
    part = next(p for p in PARTS if p[0] <= n <= p[1])
    chapters.append({'n': n, 'title': title, 'part': part[2], 'partTitle': part[3], 'sections': names,
                     'figure': {'src': img.group(1) if img else None, 'caption': txt(fig.group(1)) if fig else None},
                     'bigPicture': txt(sec.get('The Big Picture', '')), 'hits': hits, 'hooks': hooks,
                     'tables': tables, 'vaultNotes': vault_paras, 'traps': traps, 'recall': recall, 'extraSections': extra,
                     'words': len(txt(t).split())})
# exam simulator: chapter tags only (questions not copied)
sim = (OE / 'chap-examsim.xhtml').read_text(encoding='utf-8')
qtags = re.findall(r'class="qtag">Ch\.\s*(\d+)<', sim)
from collections import Counter
qc = Counter(int(x) for x in qtags)
for c in chapters: c['simulatorQuestions'] = qc.get(c['n'], 0)
OUT.write_text(json.dumps({'chapters': chapters, 'simulatorTagged': len(qtags)}, ensure_ascii=False, indent=1))
print('chapters', len(chapters), 'simulator tags', len(qtags))
odd = [(c['n'], c['sections']) for c in chapters if c['sections'][:6] != ['The Big Picture', 'High-Yield Hits', 'Memory Hooks', 'Number Vault', 'Exam Traps', '5-Second Recall']]
print('non-standard section lists:', odd)
print('hits total', sum(len(c['hits']) for c in chapters), 'hooks', sum(len(c['hooks']) for c in chapters),
      'table rows', sum(len(tb['rows']) for c in chapters for tb in c['tables']), 'tables', sum(len(c['tables']) for c in chapters),
      'traps', sum(len(c['traps']) for c in chapters), 'recall', sum(len(c['recall']) for c in chapters),
      'figures', sum(1 for c in chapters if c['figure']['caption']))
print('min/max hits', min(len(c['hits']) for c in chapters), max(len(c['hits']) for c in chapters))
print('chapters w/o simulator Qs', [c['n'] for c in chapters if not c['simulatorQuestions']])
print('extra sections', {c['n']: c['extraSections'] for c in chapters if c['extraSections']})
