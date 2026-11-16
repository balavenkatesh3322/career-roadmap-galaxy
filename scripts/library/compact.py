"""Step 3 of the library import: turn libdata/library-clean.json into src/data/library-content.json.

usage: python3 -I scripts/library/compact.py LIBDATA_DIR src/data/library-content.json
Converts bare-URL topics into named resources and keeps only what the app needs.
Repos without an open licence and articles keep no copied content (status only).
"""
import json, re, sys, os
from urllib.parse import urlparse

src, dst = os.path.join(sys.argv[1], 'library-clean.json'), sys.argv[2]
L = json.load(open(src, encoding='utf-8'))

def label(u):
    p = urlparse(u); parts = p.path.strip('/').split('/')
    name = parts[-1] if parts and parts[-1] else p.netloc
    name = re.sub(r'[-_]+', ' ', re.sub(r'\.(html?|md)$', '', name))
    host = p.netloc.replace('www.', '')
    return (host + ' · ' + name)[:70] if name != p.netloc else host

out = {}
for e in L:
    stages = []
    for s in e.get('stages', []):
        topics, res = [], list(s['resources'])
        for t in s['topics']:
            m = re.match(r'^(https?://\S+)(?:\s*-\s*(.*))?$', t)
            if m:
                if len(res) < 8: res.append({'t': (m.group(2) or label(m.group(1)))[:80], 'u': m.group(1)})
            elif not re.match(r'^https?://', t):
                topics.append(t)
        stages.append({'t': s['title'], 'k': topics[:10], 'r': [{'t': r['t'], 'u': r['u']} for r in res[:6]]})
    out[e['url']] = {'s': e['status'], 'l': e.get('license'), 'a': e.get('author'), 'st': e.get('stars'), 'n': e.get('stageCount', len(stages)), 'g': stages, 'img': e.get('images', [])}
json.dump(out, open(dst, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('wrote', dst, len(out), 'entries')
