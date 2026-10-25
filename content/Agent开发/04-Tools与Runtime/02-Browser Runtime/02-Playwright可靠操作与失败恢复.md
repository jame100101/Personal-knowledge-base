# Playwright 可靠操作与失败恢复

一条点击命令成功返回，不一定意味着业务操作已经完成。先选稳定的定位方式，再等待明确的页面结果；遇到失败时，检查当前状态而不是盲目重放所有步骤。下面按这个顺序组织 Playwright 操作。

## 1. 浏览器会话

明确 context、page、storage state 和下载目录。不同任务使用隔离 context；只有确实需要时加载已有登录状态。运行结束清理临时数据并保存必要证据。

## 2. 失败分类

- element_not_found；
- multiple_matches；
- not_visible/not_enabled；
- detached/stale；
- navigation_timeout；
- dialog_blocked；
- frame_not_found；
- auth_required；
- rate_limited；
- page_changed；
- download_failed。

不同错误使用不同恢复，而不是统一重试点击。

## 3. 恢复策略

- 重新抓取 DOM/截图；
- 关闭或处理弹窗；
- 切换 frame；
- 滚动到元素；
- 改用 role/label 定位；
- 等待明确条件；
- 回到已知 URL；
- 刷新后从检查点恢复；
- 页面结构变更时重新规划。

每次恢复有上限，并记录旧 locator、错误和新策略。

## 4. 副作用

表单提交、发布、删除、购买等动作在最后一步前分成：

```text
prepare -> preview -> confirm -> execute -> verify
```

执行前展示精确目标和参数；执行后通过页面与后端状态验证。重试提交按钮前先确认上一请求是否已经成功。

## 5. Playwright 示例

```python group=multi-cdba4d212afd label=Python
button = page.get_by_role("button", name="保存")
await expect(button).to_be_visible()
await expect(button).to_be_enabled()
await button.click()
await expect(page.get_by_text("保存成功")).to_be_visible()
```

```rust group=multi-cdba4d212afd label=Rust
let button = driver
    .query(By::XPath("//button[normalize-space()='保存']"))
    .first()
    .await?;
assert!(button.is_displayed().await?);
assert!(button.is_enabled().await?);
button.click().await?;
driver
    .query(By::XPath("//*[contains(text(),'保存成功')]"))
    .first()
    .await?;
```

```javascript group=multi-cdba4d212afd label=JavaScript
const button = page.getByRole('button', { name: '保存' })
await expect(button).toBeVisible()
await expect(button).toBeEnabled()
await button.click()
await expect(page.getByText('保存成功')).toBeVisible()
```

```typescript group=multi-cdba4d212afd label=TypeScript
const button = page.getByRole('button', { name: '保存' })
await expect(button).toBeVisible()
await expect(button).toBeEnabled()
await button.click()
await expect(page.getByText('保存成功')).toBeVisible()
```

实际 Harness 应把 locator、超时、截图和 trace 封装进工具，避免模型直接生成任意脚本。

## 6. 测试

- 元素名称相同的两个按钮；
- 迟到 3 秒的弹窗；
- iframe 表单；
- 点击后接口成功但 toast 丢失；
- 双击导致重复提交；
- 页面局部刷新；
- 下载文件名变化；
- 浏览器进程中断后恢复。

<!-- evidence-update:2026-10-25 -->

## 自动等待的边界与语言示例

点击前可见、稳定、可接收事件等检查，由 Playwright 按动作类型自动等待；`expect` 的异步断言还会重试检查结果。两者都不意味着接口已经持久化数据。对保存操作，应再断言成功状态，必要时重新加载页面验证。

上面的 Rust 片段是 WebDriver 风格的同目标示意，不是 Playwright 官方 Rust API。不能把 Python/JavaScript 的自动等待语义直接套到它上面；需要使用所选 Rust 驱动自己的等待机制。官方语言文档列出的运行方式包括 JavaScript/TypeScript、Python、Java 和 .NET。

实际练习先只选一种语言：打开测试页，填写标题，点击保存，断言结果。然后让两个按钮同名，观察严格定位如何报错；把定位限定到对应表单后再运行。这样能看懂定位条件，而不是依赖任意固定等待时间。

### 本节的核验依据

2026-10-25 查阅。下面的链接支持本节的机制说明；练习场景和选型建议是本教程的教学设计。

- [Playwright：自动等待](https://playwright.dev/docs/actionability)
- [Playwright：支持的语言](https://playwright.dev/docs/languages)
