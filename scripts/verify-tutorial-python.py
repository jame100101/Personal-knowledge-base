"""Run boundary checks against code extracted from the actual teaching pages."""
from pathlib import Path
import re
import tempfile
import subprocess


def block(path, marker):
    text = Path(path).read_text()
    return next(code for code in re.findall(r'```python[^\n]*\n(.*?)\n```', text, re.S) if marker in code)

ns = {}
exec(block('content/后端知识/02-常见后端架构/03-六边形Clean与DDD入门.md', 'class CanQuote'), ns)
quote = ns['CanQuote'](ns['DemoStock']())
for value in [True, 1.5, 0, -1, '3']:
    try:
        quote.check('book', value)
    except ValueError:
        pass
    else:
        raise AssertionError(value)
assert quote.check('book', 5)
ns = {}
exec(block('content/后端知识/04-分布式与可靠性/03-超时重试限流熔断与隔离.md', 'def retry_delay'), ns)
for args in [(True,), (1.5,), (-1,), (21,), (0, float('nan')), (0, 0.1, float('inf'))]:
    try:
        ns['retry_delay'](*args)
    except ValueError:
        pass
    else:
        raise AssertionError(args)
for attempt in range(21):
    for _ in range(20):
        assert 0 <= ns['retry_delay'](attempt) <= min(2, 0.1 * 2**attempt)
ns = {}
exec(block('content/Agent开发/04-Tools与Runtime/06-File IO读取写入补丁与原子更新.md', 'def atomic_write'), ns)
with tempfile.TemporaryDirectory() as directory:
    target = Path(directory) / 'example.txt'
    ns['atomic_write'](target, 'old')
    ns['atomic_write'](target, 'new\n中文')
    assert target.read_text() == 'new\n中文'
    # Failure must leave the existing target directory intact and remove our temporary file.
    invalid = Path(directory) / 'is-directory'
    invalid.mkdir()
    try:
        ns['atomic_write'](invalid, 'bad')
    except OSError:
        pass
    else:
        raise AssertionError('Expected replacement failure')
    assert invalid.is_dir()
    assert not list(Path(directory).glob('.is-directory.*'))
print('Python: integer validation, bounded jitter, atomic replacement and failure cleanup passed')

text = Path('content/语言基础/02-TypeScript跨语言对照/04-TypeScript与Cpp.md').read_text()
code = next(code for code in re.findall(r'```cpp\n(.*?)\n```', text, re.S) if 'max_value' in code)
with tempfile.TemporaryDirectory() as directory:
    cpp = Path(directory) / 'example.cpp'
    binary = Path(directory) / 'example'
    cpp.write_text(code + '''
#include <cassert>
#include <string>
int main() {
    const auto& value = max_value(std::string("a"), std::string("b"));
    assert(value == "b");
    assert(max_value(2, 1) == 2);
}
''')
    subprocess.run(['clang++', '-std=c++20', '-Wall', '-Wextra', '-Werror', str(cpp), '-o', str(binary)], check=True)
    subprocess.run([str(binary)], check=True)
print('C++20: actual tutorial template compiled and safely returned a value from temporary inputs')
