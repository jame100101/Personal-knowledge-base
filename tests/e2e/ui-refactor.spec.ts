import { expect, test } from '@playwright/test'
const article = '/knowledge/java-backend/spring/spring-boot/spring-boot-introduction'
const editor = '/admin/documents/new?folder=f-java'
// This suite intentionally uses only the existing isolated, in-memory development demo.
test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.demo-strip')).toBeVisible()
  await expect(page.locator('.theme-toggle')).toBeEnabled()
})

test('search supports tags, full text, keyboard, composition, clearing and focus restoration', async ({
  page,
}) => {
  const trigger = page.locator('.command-search')
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: '搜索知识库' })
  const input = page.getByLabel('搜索关键词')
  await expect(input).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(dialog.locator('.search-results a.active')).toContainText('Tool Calling')
  await input.dispatchEvent('compositionstart')
  await input.press('Enter')
  await expect(dialog).toBeVisible()
  await input.dispatchEvent('compositionend')
  await input.fill('内嵌服务器') // Present in the body; not title/tags/description.
  await expect(dialog.locator('.search-results a')).toHaveCount(1)
  await expect(dialog.locator('.search-results a')).toContainText('Spring Boot')
  await input.fill('not-found-' + 'x'.repeat(800))
  await expect(dialog.locator('.no-results p')).toBeVisible()
  await dialog.getByRole('button', { name: '清空条件' }).first().click()
  await expect(input).toHaveValue('')
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
  await page.locator('.tag-panel button').filter({ hasText: '# chunking' }).click()
  await expect(dialog.locator('.search-filters')).toContainText('#chunking')
  await expect(dialog.locator('.search-results a')).toHaveCount(1)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/document-chunking-basics/)
})

test('native modal traps Tab and rapid shortcuts keep final state correct', async ({
  page,
}) => {
  await page.keyboard.press('Control+k')
  const dialog = page.getByRole('dialog', { name: '搜索知识库' })
  await expect(dialog).toBeVisible()
  for (let i = 0; i < 12; i++) await page.keyboard.press(i % 2 ? 'Shift+Tab' : 'Tab')
  expect(
    await page.evaluate(() => !!document.activeElement?.closest('dialog[open]')),
  ).toBe(true)
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  for (let i = 0; i < 5; i++) await page.keyboard.press('Meta+k')
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('')
})

test('mobile nested drawer and search preserve scroll lock, focus and Escape order', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const menu = page.locator('.mobile-header button').first()
  await menu.click()
  const search = page.locator('.left-sidebar .search-trigger')
  await search.click()
  await expect(page.getByLabel('搜索关键词')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.locator('dialog')).toBeHidden()
  await expect(search).toBeFocused()
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden')
  await page.keyboard.press('Escape')
  await expect(menu).toBeFocused()
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('')
})

test('editor validates, preserves panels/theme, protects route leave and saves once', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(editor)
  await page.getByRole('button', { name: '保存草稿', exact: true }).click()
  await expect(page.locator('#editor-title')).toBeFocused()
  await expect(page.locator('#editor-title')).toHaveAttribute('aria-invalid', 'true')
  await page.locator('#editor-title').fill('本地验收文章')
  await page.locator('#editor-slug').fill('local-ui-test')
  const source = page.getByLabel('Markdown 原文')
  await source.fill('## 持久的编辑状态\n\n还没有保存。')
  await page.getByRole('button', { name: '预览', exact: true }).click()
  await expect(page.locator('.preview-pane .markdown-body')).toContainText(
    '持久的编辑状态',
  )
  await page.locator('.admin-mobile-header .theme-toggle').click()
  await page.getByRole('button', { name: '编辑', exact: true }).click()
  await expect(source).toHaveValue('## 持久的编辑状态\n\n还没有保存。')
  await page.locator('.admin-mobile-header > a').click()
  const confirm = page.getByRole('dialog', { name: '放弃未保存的修改？' })
  await expect(confirm).toBeVisible()
  await page.getByRole('button', { name: '继续编辑' }).click()
  await expect(source).toHaveValue('## 持久的编辑状态\n\n还没有保存。')
  await page.getByRole('button', { name: '保存草稿', exact: true }).click()
  await expect(page).toHaveURL(/\/admin\/documents\/[0-9a-f-]+$/)
  await expect(page.locator('.editor-actions')).toContainText('全部修改已保存')
  await page.locator('.admin-mobile-header > a').click()
  await expect(page).toHaveURL(/\/admin$/)
})

test('editor rejects invalid/multiple import without clearing input; back navigation can be cancelled', async ({
  page,
}) => {
  await page.goto('/admin')
  await expect(page.locator('.admin-bottom .theme-toggle')).toBeEnabled()
  await page.locator('.row-name').filter({ hasText: 'Java 后端' }).click()
  await page.locator('.quick-actions button').nth(1).click()
  await expect(page.locator('#editor-title')).toBeVisible()
  await page.locator('#editor-title').fill('保留输入')
  await page.locator('.editor-shell input[type=file]').setInputFiles({
    name: 'bad.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('bad'),
  })
  await expect(page.locator('#editor-error')).toContainText('.md')
  await expect(page.locator('#editor-title')).toHaveValue('保留输入')
  await page.locator('.editor-shell input[type=file]').setInputFiles({
    name: 'too-big.md',
    mimeType: 'text/markdown',
    buffer: Buffer.alloc(2 * 1024 * 1024 + 1),
  })
  await expect(page.locator('#editor-error')).toContainText('2 MB')
  await page.goBack()
  await expect(page.getByRole('dialog', { name: '放弃未保存的修改？' })).toBeVisible()
  await page.getByRole('button', { name: '继续编辑' }).click()
  await expect(page.locator('#editor-title')).toHaveValue('保留输入')
  await page.locator('.admin-brand').click()
  await page.getByRole('button', { name: '放弃并离开' }).click()
  await expect(page).toHaveURL(/\/admin$/)
})

test('folder creation modal works above mobile admin drawer', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/admin')
  const menu = page.locator('.admin-mobile-header > button').first()
  await expect(page.locator('#admin-navigation')).toHaveAttribute('inert', '')
  await menu.click()
  await page.getByRole('button', { name: '文件夹', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '新建文件夹', exact: true })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('textbox').fill('隔离界面测试')
  await dialog.getByRole('button', { name: '创建', exact: true }).click()
  await expect(dialog).toBeHidden()
  await expect(page.locator('.explorer-message')).toContainText('隔离界面测试')
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden')
  await page.keyboard.press('Escape')
  await expect(menu).toBeFocused()
})

test('copy reports real success and failure, diagram restores focus, article anchors remain usable', async ({
  page,
}) => {
  await page.goto(article)
  await page.locator('.copy-code').first().waitFor()
  await page.evaluate(() =>
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async () => {} },
    }),
  )
  const copy = page.locator('.copy-code').first()
  const before = await copy.boundingBox()
  await copy.click()
  await expect(copy).toHaveText('已复制')
  expect((await copy.boundingBox())!.width).toBe(before!.width)
  await page.evaluate(() =>
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error('denied')
        },
      },
    }),
  )
  await copy.click()
  await expect(page.locator('.copy-status')).toContainText('复制失败')
  const enlarge = page.locator('.mermaid-open-button').first()
  await enlarge.click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(enlarge).toBeFocused()
  const anchor = page.locator('.toc nav a').nth(1)
  await anchor.click()
  expect(decodeURIComponent(new URL(page.url()).hash)).toBe(
    await anchor.getAttribute('href'),
  )
})

for (const locale of ['zh-CN', 'en', 'zh-TW']) {
  test(`theme and language with reduced motion: ${locale}`, async ({
    page,
    context,
  }) => {
    await context.addCookies([
      { name: 'kb-locale', value: locale, url: 'http://127.0.0.1:3002' },
    ])
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('lang', locale)
    for (let i = 0; i < 2; i++) {
      await page.locator('.theme-toggle').click()
      await page.keyboard.press('Control+k')
      await expect(page.locator('dialog[open]')).toBeVisible()
      await expect(page.locator('.kb-dialog-panel')).toHaveCSS(
        'transform',
        /none|matrix\(1, 0, 0, 1, 0, 0\)/,
      )
      await page.keyboard.press('Escape')
      await expect(page.locator('dialog')).toBeHidden()
    }
  })
}

test('SSR and core navigation stay readable without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:3002' + article)
  await expect(page.locator('.markdown-body')).toContainText('自动配置')
  await expect(page.locator('.breadcrumbs a').first()).toBeVisible()
  await context.close()
})

test('mobile outline retains reading focus and language menu supports keyboard selection', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(article)
  await page.locator('.toc-toggle').click()
  const link = page.locator('.toc nav a').nth(1)
  const id = (await link.getAttribute('href'))!.slice(1)
  await link.click()
  await expect(page.locator('.toc-toggle')).toHaveAttribute('aria-expanded', 'false')
  expect(await page.evaluate(() => document.activeElement?.id)).toBe(id)
  await page.locator('.mobile-header button').first().click()
  await page.locator('.language-trigger').click()
  await page.keyboard.press('Home')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.locator('.language-trigger')).toBeFocused()
})

test('long Markdown preview preserves math, tables, tasks, diagrams and latest input', async ({
  page,
}) => {
  await page.goto(editor)
  const source = page.getByLabel('Markdown 原文')
  const markdown =
    '# 本地长文\n\n' +
    '| 项目 | 数量 |\n| --- | --- |\n| 示例 | 12 |\n\n' +
    '- [x] 已完成\n\n$$a^2+b^2=c^2$$\n\n' +
    '```mermaid\ngraph LR\n A[输入] --> B[输出]\n```\n\n' +
    Array.from(
      { length: 120 },
      (_, i) => `## 第 ${i + 1} 节\n\n这是用于本地预览验收的正文。`,
    ).join('\n\n')
  await source.fill(markdown)
  await source.press('End')
  await source.press('ControlOrMeta+End')
  await source.press('Enter')
  await source.pressSequentially('LATEST')
  await expect(source).toHaveValue(markdown + '\nLATEST')
  await expect(page.locator('.preview-pane .markdown-body')).toContainText('LATEST')
  await expect(page.locator('.preview-pane table')).toBeVisible()
  await expect(page.locator('.preview-pane .katex').first()).toBeVisible()
  await expect(page.locator('.preview-pane input[type=checkbox]')).toBeChecked()
  await expect(
    page.locator('.preview-pane .mermaid-interactive svg').first(),
  ).toBeVisible()
  await page.locator('.editor-shell .drop-zone').evaluate((element) => {
    const data = new DataTransfer()
    data.items.add(new File(['one'], 'one.md', { type: 'text/markdown' }))
    data.items.add(new File(['two'], 'two.md', { type: 'text/markdown' }))
    element.dispatchEvent(
      new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: data }),
    )
  })
  await expect(page.locator('#editor-error')).toContainText('一次只能编辑一个文件')
  await expect(source).toHaveValue(markdown + '\nLATEST')
  const dialogEvent = page.waitForEvent('dialog')
  // Chromium can leave the cancelled reload waiter pending even after dismissal.
  const reload = page.reload({ timeout: 3000, waitUntil: 'commit' }).catch(() => null)
  const native = await dialogEvent
  expect(native.type()).toBe('beforeunload')
  await native.dismiss()
  await reload
  await expect(source).toHaveValue(markdown + '\nLATEST')
})

test('login configuration and missing routes show explicit recoverable states', async ({
  page,
}) => {
  await page.goto('/admin/login')
  await expect(page.getByRole('heading', { name: '管理员登录' })).toBeVisible()
  await expect(page.locator('.config-notice')).toContainText('尚未配置')
  await page.goto('/knowledge/this-route-does-not-exist')
  await expect(page.getByRole('link', { name: '返回知识库' })).toBeVisible()
  await page.getByRole('link', { name: '返回知识库' }).click()
  await expect(page.locator('.command-search')).toBeVisible()
})
