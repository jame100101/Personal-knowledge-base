"""Inventory evidence and review gaps; heuristics never certify factual correctness."""
import argparse
import hashlib
import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def prose_only(text):
    lines, fence = [], None
    for line in text.splitlines():
        match = re.match(r'^\s*(`{3,}|~{3,})', line)
        if match:
            marker = match.group(1)
            if fence is None:
                fence = marker
            elif marker[0] == fence[0] and len(marker) >= len(fence):
                fence = None
            continue
        if fence is None:
            lines.append(line)
    return '\n'.join(lines)

def inventory():
    result = []
    for path in sorted((ROOT / 'content').rglob('*.md')):
        text = path.read_text(encoding='utf-8')
        prose = prose_only(text)
        match = re.search(r'last_verified[^\n]*?(\d{4}-\d{2}-\d{2})', prose)
        flags = []
        if not re.search(r'是什么|是指|指的是|用于|就是|是一|意味着', prose):
            flags.append('definition-needs-reader-review')
        if not re.search(r'例[子如]|示例|举例|假设|比如|```(?:java|python|typescript|javascript|rust|sql)', text):
            flags.append('example-needs-reader-review')
        if re.search(r'当前|最新|默认|已发布|稳定版|GA\b', prose):
            flags.append('version-claims-need-evidence')
        result.append({'path': path.relative_to(ROOT).as_posix(),
                       'sha256': hashlib.sha256(text.encode()).hexdigest(),
                       'characters': len(text),
                       'headings': re.findall(r'^#{1,6} .+', prose, re.M),
                       'last_verified': match.group(1) if match else None,
                       'source_urls': sorted(set(re.findall(r'https?://[^\s<>`)\]]+', prose))),
                       'review_flags': flags,
                       'semantic_review': 'pending unless recorded in audit report'})
    return {'scope': 'inventory only; not a correctness certificate',
            'documents': len(result),
            'areas': dict(Counter(r['path'].split('/')[1] for r in result)),
            'items': result}

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    data = inventory()
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'documents': data['documents'], 'areas': data['areas'],
                      'flag_counts': dict(Counter(f for i in data['items'] for f in i['review_flags']))}, ensure_ascii=False))
