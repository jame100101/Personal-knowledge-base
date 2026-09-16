# Browser Agent 推荐阅读

浏览器自动化可以先练习打开页面、定位一个控件、读取结果。每一步都观察页面是否真的进入预期状态，再加入弹窗、加载失败等情况。下面的资料用于理解这种交互过程，不只是收集点击命令。

- [Playwright Documentation](https://playwright.dev/docs/intro)：locator、auto-wait、browser context、trace 和测试断言。
- [Anthropic Computer Use](https://docs.anthropic.com/en/docs/agents-and-tools/computer-use)：computer tool 的观察与动作接口。
- [browser-use](https://github.com/browser-use/browser-use)：开源 Browser Agent 实现。
- [WebArena](https://arxiv.org/abs/2307.13854)：真实网页任务 benchmark。
- [VisualWebArena](https://arxiv.org/abs/2401.13649)：结合视觉理解的网页 Agent benchmark。
- [OSWorld](https://arxiv.org/abs/2404.07972)：跨桌面操作系统的多模态 Agent 环境。

建议产出：使用 Playwright 完成公开网页信息提取，保存每步 DOM、截图与动作日志，并加入弹窗、加载失败和 locator 变化测试。
