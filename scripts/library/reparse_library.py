"""Re-parse downloaded READMEs (libdata/raw/*.md) into cleaner stages.

usage: python3 -I reparse_library.py LIBDATA_DIR
Rules:
- stage level = shallowest heading level (## .. ####) that appears >= 3 times after skipping meta headings
- deeper headings inside a stage become topic groups (their text is a topic)
- list items WITHOUT a link -> topics (concepts); list items WITH a link -> resources
- only repos with an open licence keep their content (others: status 'permission-needed')
"""
import json, re, sys, os
from collections import Counter

d = sys.argv[1]
L = json.load(open(os.path.join(d, 'library.json'), encoding='utf-8'))
OPEN = {'MIT', 'Apache-2.0', 'CC0-1.0', 'CC-BY-4.0', 'CC-BY-SA-4.0', 'GPL-3.0', 'BSD-3-Clause', 'BSD-2-Clause', 'Unlicense', 'ISC'}
META = re.compile(r'^(table of contents|contents|index|license|licen[cs]e.*|contribut\w*|contributors?|support\w*|sponsors?|credits?|acknowledg\w*|star history|disclaimer|donat\w*|faq|translations?|author|about.*|stargazers.*|show your support|share|back to top|changelog|todo|wrap up|conclusion|why .*|who (this|it) is for.*|teaching approach|design principles|readme.*|project roadmap|how to (use|read|contribute).*|getting started with this repo|repository structure|search and ask.*|related.*|see also|notes?|introduction|overview|preface|motivation|feedback|community|roadmap image|the roadmap|roadmap|authors?|additional resources|other resources|more resources|useful links|references|disclaimers?|star\s*history|support the project|buy me a coffee)$', re.I)
EMOJI = re.compile('[\U0001F000-\U0001FAFF☀-➿️‍⭐⬆↔-↪]+')

def clean(t):
    t = re.sub(r'!\[[^\]]*\]\([^)]*\)', '', t)
    t = re.sub(r'\[([^\]]+)\]\([^)]*\)', r'\1', t)
    t = re.sub(r'<[^>]+>', '', t)
    t = EMOJI.sub('', t)
    t = re.sub(r'[*_`~#>]+', '', t)
    t = re.sub(r'^\s*(\d+(\.\d+)*[.)]?|[-+]|\[[ xX]\])\s+', '', t)
    t = re.sub(r':[a-z_]+:', '', t)
    t = re.sub(r'\b(FREE|PAID)\b', '', t)
    return re.sub(r'\s+', ' ', t).strip(' -–—:|')

def parse(md):
    lines, in_code, heads = [], False, []
    for raw in md.splitlines():
        if raw.strip().startswith('```'): in_code = not in_code; continue
        if not in_code: lines.append(raw)
    for raw in lines:
        h = re.match(r'^(#{2,4})\s+(.*)', raw)
        if h and clean(h.group(2)) and not META.match(clean(h.group(2))): heads.append(len(h.group(1)))
    def score(level):
        """(distinct section titles at `level` holding >= 2 list items, share of repeated titles)."""
        titles, items, cur = [], {}, None
        for raw in lines:
            h = re.match(r'^(#{1,6})\s+(.*)', raw)
            if h:
                lv, t = len(h.group(1)), clean(h.group(2))
                if lv == level and t and not META.match(t):
                    cur = t.lower(); titles.append(cur); items.setdefault(cur, 0)
                elif lv <= level:
                    cur = None
                continue
            if cur is not None and re.match(r'^\s*(?:[-*+]|\d+[.)])\s+', raw):
                items[cur] += 1
        if not titles:
            return 0, 1.0
        repeats = 1 - len(set(titles)) / len(titles)
        return sum(1 for t in set(titles) if items[t] >= 2), repeats
    best, level = (-1, 0), 2
    for lv in (2, 3, 4):
        sc, rep = score(lv)
        if rep <= 0.15 and sc >= 3 and sc > best[0]:
            best, level = (sc, lv), lv
    stages, cur, skipping = [], None, False
    for raw in lines:
        h = re.match(r'^(#{1,6})\s+(.*)', raw)
        if h:
            lv, title = len(h.group(1)), clean(h.group(2))
            if lv < level:
                skipping = bool(META.match(title or ''))
                cur = None
                continue
            if lv == level:
                skipping = (not title) or bool(META.match(title))
                cur = None if skipping else {'title': title[:70], 'topics': [], 'resources': []}
                if cur: stages.append(cur)
            elif cur is not None and not skipping and title and not META.match(title) and len(cur['topics']) < 12:
                cur['topics'].append(title[:80])
            continue
        if cur is None or skipping: continue
        li = re.match(r'^\s*(?:[-*+]|\d+[.)])\s+(.*)', raw)
        if not li: continue
        links = [(clean(t), u) for t, u in re.findall(r'\[([^\]]+)\]\((https?://[^)\s]+)\)', li.group(1)) if 'shields.io' not in u and 'badge' not in u]
        text = clean(li.group(1))
        if links:
            if len(cur['resources']) < 8: cur['resources'].append({'t': (text or links[0][0])[:90], 'u': links[0][1]})
        elif text and len(cur['topics']) < 12:
            cur['topics'].append(text[:90])
    return [s for s in stages if len(s['topics']) + len(s['resources']) >= 2][:12]

# READMEs that document an app, site or book rather than a learning path: show our roadmap instead
NOT_A_PATH = {'https://github.com/rudra496/devroadmaps', 'https://github.com/mbianchidev/platform-engineering-roadmap',
              'https://github.com/Haozhe-Xing/agent_learning', 'https://github.com/microsoft/AI-For-Beginners',
              'https://github.com/bojieli/ai-agent-book', 'https://github.com/AdilShamim8/Agentic-AI-Roadmap-with-Notes-and-Projects'}

for e in L:
    p = os.path.join(d, 'raw', e['id'] + '.md')
    e.pop('stages', None)
    if e['kind'] == 'web':
        e['status'] = 'article'  # copyrighted page: in-app summary only
        e['stages'] = []
        continue
    md = open(p, encoding='utf-8').read() if os.path.exists(p) else ''
    stages = parse(md) if md else []
    imgs = len(re.findall(r'!\[[^\]]*\]\([^)]*\.(?:png|jpe?g|svg|gif|webp)', md, re.I))
    e['images'] = []
    m = re.match(r'https://github\.com/([^/]+)/([^/#?]+)', e['url'])
    if m and md:
        found = re.findall(r'!\[[^\]]*\]\(\s*<?([^)\s>]+\.(?:png|jpe?g|webp|gif|svg))', md, re.I) + re.findall(r'<img[^>]+src=["\']([^"\']+\.(?:png|jpe?g|webp|gif|svg))', md, re.I)
        for u in found:
            if re.search(r'shields\.io|badge|logo|avatar|icon|emoji|buymeacoffee|buy-me|ko-fi|kofi|sponsor|patreon|patron|donat|paypal|support|github-readme-stats|contrib\.rocks|star-history|api\.star|banner|header|cover', u, re.I): continue
            if u.startswith('http'):
                u = re.sub(r'https://github\.com/([^/]+)/([^/]+)/blob/', r'https://raw.githubusercontent.com/\1/\2/', u)
                u = u.replace('?raw=true', '')
            else:
                u = f"https://raw.githubusercontent.com/{m.group(1)}/{m.group(2)}/HEAD/{u.lstrip('./')}"
            # only the author's own files (covered by the repo licence), not third-party hosts
            if not re.match(r'https://(raw\.githubusercontent\.com|user-images\.githubusercontent\.com|github\.com/user-attachments|private-user-images\.githubusercontent\.com)/', u): continue
            if u not in e['images']: e['images'].append(u)
        e['images'] = e['images'][:4]
    if e.get('license') not in OPEN:
        e['images'] = []
        e['status'] = 'permission-needed'
        e['stageCount'] = len(stages)
        e['stages'] = []
    elif e['url'] in NOT_A_PATH:
        e['status'] = 'external'
        e['stages'] = []
    elif len(stages) >= 3:
        e['status'] = 'imported'
        e['stages'] = stages
    else:
        e['status'] = 'visual' if imgs else 'thin'
        e['stages'] = stages

json.dump(L, open(os.path.join(d, 'library-clean.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(Counter(e['status'] for e in L))
print('size KB', round(os.path.getsize(os.path.join(d, 'library-clean.json')) / 1024, 1))
for e in L:
    if e['status'] == 'imported':
        print(f"{len(e['stages']):2}  {e['license']:12} {e['title']}: " + ' | '.join(s['title'] for s in e['stages'][:5]))
