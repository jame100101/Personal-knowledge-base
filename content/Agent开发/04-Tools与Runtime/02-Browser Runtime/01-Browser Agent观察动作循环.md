# Browser Agent 的观察—动作循环

网页上的按钮可能还没加载，也可能被弹窗遮住。Browser Agent 必须根据当前页面决定动作，并在操作后重新观察。下面把 DOM、截图与页面状态放在同一轮循环里理解。

Browser Agent 与普通 API Tool 的差别在于：网页是动态、部分可观察、受异步加载影响的环境。动作通常依赖当前 DOM、视觉状态、URL、frame 和登录状态。

## 1. 观察

可用观察包括：

- URL、标题和导航历史；
- DOM/可访问性树；
- 可交互元素及稳定定位；
- 截图；
- 网络/控制台错误；
- frame、dialog、下载；
- 上一步动作结果。

不要每轮把完整 HTML 塞给模型。先提取可交互节点、相关文本和页面状态摘要，需要视觉判断时再加入截图。

## 2. 动作空间

- navigate；
- click；
- fill/type；
- select；
- scroll；
- hover；
- upload/download；
- wait；
- extract；
- screenshot；
- back/forward。

每个动作要返回结构化结果：目标 locator、动作前后 URL、页面变化、错误和截图/DOM 证据。

## 3. 定位策略

优先顺序：

1. role + accessible name；
2. label；
3. stable test id；
4. 文本；
5. CSS/XPath 作为最后选择。

记录候选数量，避免 locator 模糊时点击第一个。页面变化后重新观察，不复用失效 element handle。

## 4. 动作验证

点击成功不等于目标完成。根据动作验证：

- URL 或路由变化；
- 目标元素出现；
- 表单字段值；
- toast/状态文本；
- 网络响应；
- 文件下载存在；
- 后端状态查询。

## 5. 动态页面

避免固定 `sleep(5000)`；使用条件等待：

- DOMContentLoaded/networkidle 适用时；
- 元素可见且 enabled；
- 响应完成；
- 特定状态文本；
- 动画结束。

对 SPA，URL 不变也可能页面状态改变，应联合 DOM 与应用状态判断。

<!-- evidence-update:2026-10-25 -->

## 点击之后，再观察一次

用“修改工单标题”做练习：先读当前标题和输入框，再填写新标题，点击保存，最后重新读取页面上的标题。每一步都保留观察结果，才能区分“按钮点到了”和“数据真的改好了”。

Playwright 的 locator 会在执行动作时定位元素，并进行相应的可操作性检查。它解决的是页面元素能不能操作，不替你证明业务成功。若按钮点击后页面没有变化，先看错误提示与请求结果；不要马上再点五次。

可以故意让保存接口返回错误，检查 Agent 是否仍错误地说“修改成功”。这个练习的完成标准是新标题真实出现，或明确说明失败原因，而不是产生一张看起来像操作完成的截图。

### 本节的核验依据

2026-10-25 查阅。下面的链接支持本节的机制说明；练习场景和选型建议是本教程的教学设计。

- [Playwright：定位器](https://playwright.dev/docs/locators)
- [Playwright：自动等待](https://playwright.dev/docs/actionability)
