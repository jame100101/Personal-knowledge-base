"""Read remote HEADs without pulling, running upstream code, or editing content.

Exit 0: unchanged; 1: retrieval failure; 2: source changes need human review.
"""
import argparse
import json
import os
import sys
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def check(repo, expected):
    if not re.fullmatch(r'[\w.-]+/[\w.-]+', repo):
        raise ValueError('Invalid repository name')
    result = subprocess.run(['git', '-c', 'http.lowSpeedLimit=1', '-c', 'http.lowSpeedTime=20',
                             'ls-remote', '--exit-code',
                             f'https://github.com/{repo}.git', 'HEAD'],
                            capture_output=True, text=True, timeout=30,
                            env={**os.environ, 'GIT_TERMINAL_PROMPT': '0'})
    if result.returncode:
        raise RuntimeError(result.stderr.strip() or 'git ls-remote failed')
    fields = result.stdout.split()
    if not fields:
        raise ValueError('Empty remote HEAD response')
    actual = fields[0]
    if not re.fullmatch(r'[a-f0-9]{40}', actual):
        raise ValueError('Unexpected remote SHA')
    return {'repo': repo, 'reviewed_head': expected, 'remote_head': actual,
            'status': 'unchanged' if expected == actual else 'needs-review'}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    records = json.loads((ROOT / 'docs/audit/source-review-2026-09-20.json').read_text())
    sources = {r['repo']: r['head'] for r in records}
    sources['bojieli/ai-agent-book'] = '4dc4429d56ff9c5d7cc7dcbc971cfcd6a618d674'
    results = []
    for repo, expected in sources.items():
        print(f'Checking {repo}...', file=sys.stderr, flush=True)
        try:
            results.append(check(repo, expected))
        except (ValueError, RuntimeError, subprocess.TimeoutExpired, OSError) as error:
            results.append({'repo': repo, 'status': 'error', 'error': str(error)})
    payload = json.dumps(results, ensure_ascii=False, indent=2) + '\n'
    print(payload)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(payload, encoding='utf-8')
    if any(r['status'] == 'error' for r in results):
        return 1
    return 2 if any(r['status'] == 'needs-review' for r in results) else 0

if __name__ == '__main__':
    raise SystemExit(main())
