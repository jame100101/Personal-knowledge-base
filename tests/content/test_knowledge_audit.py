import importlib.util
import json
import subprocess
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]

def load(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'scripts' / f'{name}.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

audit = load('audit-knowledge')
upstream = load('check-knowledge-upstreams')

class AuditTests(unittest.TestCase):
    def test_fenced_headings_are_not_prose(self):
        text = '# Real\n```python\n# fake\n```\n## Real again'
        self.assertEqual(audit.prose_only(text), '# Real\n## Real again')

    def test_long_and_tilde_fences(self):
        self.assertEqual(audit.prose_only('~~~~\n## fake\n~~~\n~~~~\n# Real'), '# Real')

    def test_inventory_covers_every_document(self):
        result = audit.inventory()
        self.assertEqual(result['documents'], len(list((ROOT/'content').rglob('*.md'))))
        self.assertEqual(len({i['path'] for i in result['items']}), result['documents'])
        self.assertTrue(all('semantic_review' in i for i in result['items']))

    def test_source_records_are_pinned(self):
        rows = json.loads((ROOT/'docs/audit/source-review-2026-09-20.json').read_text())
        self.assertEqual(len(rows), 10)
        for row in rows:
            self.assertRegex(row['head'], r'^[a-f0-9]{40}$')
            self.assertIn(row['head'], row['source'])
            self.assertTrue((ROOT/row['file']).exists())

    def test_rejects_non_repository_argument(self):
        with self.assertRaises(ValueError):
            upstream.check('--upload-pack=anything', 'a'*40)

    @patch.object(upstream.subprocess, 'run')
    def test_changed_head_requires_review(self, run):
        run.return_value = subprocess.CompletedProcess([], 0, 'b'*40+'\tHEAD\n', '')
        self.assertEqual(upstream.check('owner/repo', 'a'*40)['status'], 'needs-review')

    @patch.object(upstream.subprocess, 'run')
    def test_network_error_is_not_success(self, run):
        run.return_value = subprocess.CompletedProcess([], 1, '', 'network error')
        with self.assertRaises(RuntimeError):
            upstream.check('owner/repo', 'a'*40)

    @patch.object(upstream.subprocess, 'run')
    def test_empty_head_is_not_success(self, run):
        run.return_value = subprocess.CompletedProcess([], 0, '', '')
        with self.assertRaises(ValueError):
            upstream.check('owner/repo', 'a'*40)

    @patch.object(upstream.subprocess, 'run')
    def test_malformed_head_is_not_success(self, run):
        run.return_value = subprocess.CompletedProcess([], 0, 'not-a-sha\tHEAD\n', '')
        with self.assertRaises(ValueError):
            upstream.check('owner/repo', 'a'*40)

    def test_book_eval_link_uses_chapter_seven(self):
        p=next((ROOT/'content/Agent开发').glob('08-*/01-Eval*'))
        text=p.read_text()
        self.assertIn('book/chapter7/', text)
        self.assertNotIn('book/chapter6/', text)

if __name__ == '__main__':
    unittest.main()
