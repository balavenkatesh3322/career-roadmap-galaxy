"""Pull every roadmap listed in awesome-roadmaps' README and parse it into stages/topics.

usage: python3 -I pull_library.py README.md OUT_DIR
Writes OUT_DIR/raw/<slug>.md (downloaded, untrusted) and OUT_DIR/library.json (parsed).
"""
import json, re, sys, time, urllib.request, urllib.error, os

readme, out = sys.argv[1], sys.argv[2]
os.makedirs(os.path.join(out, 'raw'), exist_ok=True)
UA = {'User-Agent': 'roadmap-library-fetcher', 'Accept': 'application/vnd.github+json'}

def get(url, accept=None):
    h = dict(UA)
    if accept: h['Accept'] = accept
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=h), timeout=20) as r:
            return r.status, r.read().decode('utf-8', 'replace'), dict(r.headers)
    except urllib.error.HTTPError as e:
        return e.code, '', dict(e.headers or {})
    except Exception as e:  # network errors
        return 0, str(e), {}

# ---------- parse awesome list ----------
section, entries = None, []
for line in open(readme, encoding='utf-8'):
    m = re.match(r'^##\s+(.+)', line)
    if m: section = m.group(1).strip(); continue
    m = re.match(r'^- \[([^\]]+)\]\(([^)]+)\)\s*-\s*(.*)', line)
    if m and section not in (None, 'Contents', 'License'):
        desc = re.sub(r'<img[^>]*>', '', m.group(3)).strip()
        year = re.search(r'Year-(\d{4})', line)
        entries.append({'title': m.group(1), 'url': m.group(2), 'section': section, 'desc': desc, 'year': int(year.group(1)) if year else None})

SKIP = re.compile(r'^(table of contents|contents|license|licen[cs]e.*|contribut\w*|contributors?|support\w*|sponsors?|credits?|acknowledg\w*|star history|disclaimer|donat\w*|faq|translations?|author|about( me| the author)?|stargazers.*|show your support|share|back to top|changelog|todo|wrap up|conclusion)\b', re.I)

def clean(t):
    t = re.sub(r'!\[[^\]]*\]\([^)]*\)', '', t)
    t = re.sub(r'\[([^\]]+)\]\([^)]*\)', r'\1', t)
    t = re.sub(r'<[^>]+>', '', t)
    t = re.sub(r'[*_`~#>]+', '', t)
    t = re.sub(r'^\s*(\d+[.)]|[-+]|\[[ xX]\])\s*', '', t)
    t = re.sub(r':[a-z_]+:', '', t)  # emoji shortcodes
    return re.sub(r'\s+', ' ', t).strip(' -–—:|')

def parse_md(md):
    stages, cur = [], None
    in_code = False
    for raw in md.splitlines():
        if raw.strip().startswith('```'):
            in_code = not in_code; continue
        if in_code: continue
        h = re.match(r'^(#{2,4})\s+(.*)', raw)
        if h:
            title = clean(h.group(2))
            if not title or SKIP.match(title): cur = None; continue
            if len(h.group(1)) <= 3 or cur is None:
                cur = {'title': title[:80], 'topics': [], 'links': []}
                stages.append(cur)
            else:  # #### becomes a topic of the current stage
                cur['topics'].append(title[:90])
            continue
        li = re.match(r'^\s*(?:[-*+]|\d+[.)])\s+(.*)', raw)
        if li and cur is not None:
            text = clean(li.group(1))
            for lt, lu in re.findall(r'\[([^\]]+)\]\((https?://[^)\s]+)\)', li.group(1)):
                if len(cur['links']) < 6 and 'shields.io' not in lu and 'badge' not in lu:
                    cur['links'].append({'t': clean(lt)[:80], 'u': lu})
            if text and len(text) > 1 and len(cur['topics']) < 14:
                cur['topics'].append(text[:90])
    stages = [s for s in stages if s['topics'] or s['links']]
    return stages[:14]

slug = lambda s: re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')
api_left = None
for e in entries:
    e['id'] = slug(e['title'])
    m = re.match(r'https://github\.com/([^/]+)/([^/#?]+)', e['url'])
    e['kind'] = 'github' if m else 'web'
    e['stages'], e['license'], e['author'] = [], None, None
    if not m:
        continue
    owner, repo = m.group(1), m.group(2)
    e['author'] = owner
    if '/blob/' in e['url'] and e['url'].endswith('.pdf'):
        e['kind'] = 'pdf'
    code, body, hdr = get(f'https://api.github.com/repos/{owner}/{repo}')
    api_left = hdr.get('X-RateLimit-Remaining', api_left)
    branch = 'main'
    if code == 200:
        info = json.loads(body)
        branch = info.get('default_branch') or 'main'
        lic = info.get('license') or {}
        e['license'] = lic.get('spdx_id') if lic.get('spdx_id') not in (None, 'NOASSERTION') else (lic.get('name') or None)
        e['archived'] = info.get('archived', False)
        e['stars'] = info.get('stargazers_count')
    md = ''
    for name in ('README.md', 'readme.md', 'Readme.md', 'README.MD', 'README'):
        c, b, _ = get(f'https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{name}')
        if c == 200 and b.strip():
            md = b; break
    if md:
        open(os.path.join(out, 'raw', e['id'] + '.md'), 'w', encoding='utf-8').write(md)
        e['stages'] = parse_md(md)
        e['images'] = len(re.findall(r'!\[[^\]]*\]\([^)]*\.(?:png|jpe?g|svg|gif)', md, re.I))
    time.sleep(0.3)

json.dump(entries, open(os.path.join(out, 'library.json'), 'w'), ensure_ascii=False, indent=1)
gh = [e for e in entries if e['kind'] == 'github']
print('entries', len(entries), '| github', len(gh), '| parsed with stages', sum(1 for e in gh if e['stages']), '| api remaining', api_left)
from collections import Counter
print('licenses', Counter(e['license'] for e in gh))
for e in entries:
    print(f"{e['kind']:6} {len(e['stages']):2} stages  {str(e['license']):12} {e['title']}")
