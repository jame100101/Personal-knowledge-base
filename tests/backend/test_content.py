"""Static checks for original backend tutorials; SQL snippets target their stated engine."""
import ast
import json
from pathlib import Path
import re
import subprocess
import sys
import unittest

ROOT = Path(__file__).resolve().parents[2]
CONTENT = ROOT/'content/后端知识'


class ContentTests(unittest.TestCase):
    def test_curriculum_covers_seven_sections(self):
        self.assertEqual(len([p for p in CONTENT.iterdir() if p.is_dir()]), 7)
        self.assertGreaterEqual(len(list(CONTENT.rglob('*.md'))), 22)

    def test_documents_have_teaching_and_sources(self):
        titles = set()
        for path in CONTENT.rglob('*.md'):
            text = path.read_text(encoding='utf-8')
            with self.subTest(file=path.name):
                self.assertGreater(len(text), 900)
                title = re.findall(r'^# (.+)$', text, re.M)
                self.assertEqual(len(title), 1)
                self.assertNotIn(title[0], titles)
                titles.add(title[0])
                self.assertIn('https://', text)
                self.assertGreaterEqual(len(re.findall(r'^## ', text, re.M)), 4)
                self.assertEqual(len(re.findall(r'^```', text, re.M)) % 2, 0)
                self.assertRegex(text, r'练习|自检|演练|测试')

    def test_json_and_python_blocks_parse(self):
        for path in CONTENT.rglob('*.md'):
            for language, body in re.findall(r'^```(\w+)[^\n]*\n(.*?)^```', path.read_text(), re.M | re.S):
                with self.subTest(file=path.name, language=language):
                    if language == 'python':
                        ast.parse(body)
                    if language == 'json':
                        json.loads(body)

    def test_http_example_responds(self):
        import http.client
        import threading
        from http.server import ThreadingHTTPServer
        path = next(CONTENT.glob('01-*'+'/01-*'))
        body = re.search(r'^```python\n(.*?)^```', path.read_text(), re.M | re.S).group(1)
        namespace = {'__name__': 'backend_example'}
        exec(compile(body, str(path), 'exec'), namespace)
        handler = namespace['Handler']
        handler.log_message = lambda *args: None
        server = ThreadingHTTPServer(('127.0.0.1', 0), handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            for route, status in [('/health', 200), ('/missing', 404)]:
                connection = http.client.HTTPConnection('127.0.0.1', server.server_port, timeout=5)
                try:
                    connection.request('GET', route)
                    response = connection.getresponse()
                    self.assertEqual(response.status, status)
                    payload = response.read()
                    if status == 200:
                        self.assertEqual(json.loads(payload), {'process': 'alive'})
                finally:
                    connection.close()
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=5)

    def test_non_server_python_examples_run(self):
        # Explicit allowlist of our finite, side-effect-free teaching examples.
        prefixes = ['03-进程线程', '03-六边形', '03-超时重试', '02-架构选型']
        count = 0
        for path in CONTENT.rglob('*.md'):
            if not any(path.name.startswith(prefix) for prefix in prefixes):
                continue
            for body in re.findall(r'^```python\n(.*?)^```', path.read_text(), re.M | re.S):
                result = subprocess.run([sys.executable, '-c', body], capture_output=True, text=True, timeout=10)
                self.assertEqual(result.returncode, 0, result.stderr)
                count += 1
        self.assertEqual(count, 4)


if __name__ == '__main__':
    unittest.main()
