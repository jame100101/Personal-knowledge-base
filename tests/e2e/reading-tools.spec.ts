import { expect, test } from '@playwright/test'

const article =
  '/knowledge/agent-development/modern-agent-12eureu/openai-codex-agent-loop-skills-context-harness-1txmyyk'

test('reading size persists and applies on mobile as well as desktop', async ({
  page,
}) => {
  await page.goto(article)
  const body = page.locator('#article-body .markdown-body')
  await expect(body).toBeVisible()
  await page.getByRole('button', { name: '正文字号 20', exact: true }).click()
  await expect(body).toHaveCSS('font-size', '20px')
  await page.reload()
  await expect(
    page.getByRole('button', { name: '正文字号 20', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(body).toHaveCSS('font-size', '20px')
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(body).toHaveCSS('font-size', '20px')
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    )
    .toBe(true)
  await page.getByRole('button', { name: '正文字号 16', exact: true }).click()
  await expect(body).toHaveCSS('font-size', '16px')
})

test('outline filtering, keyboard jumps and active section reflect the article', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto(article)
  const input = page.getByRole('searchbox', { name: '查找本页小节' })
  await input.fill('不存在的小节xyz')
  await expect(page.locator('.toc-empty')).toBeVisible()
  await expect(page.locator('#article-outline a')).toHaveCount(0)
  await page.getByRole('button', { name: '清除小节筛选' }).click()
  const total = await page.locator('#article-outline a').count()
  expect(total).toBeGreaterThan(8)
  await input.fill('Context')
  const filtered = page.locator('#article-outline a')
  expect(await filtered.count()).toBeLessThan(total)
  const target = filtered.first()
  const href = await target.getAttribute('href')
  await target.focus()
  await page.keyboard.press('Enter')
  await expect
    .poll(() => page.evaluate(() => document.activeElement?.id))
    .toBe(href!.slice(1))
  await expect(target).toHaveAttribute('aria-current', 'location')
  // A late diagram above the destination must not strand the jump at an old offset.
  await page.evaluate((id) => {
    const spacer = document.createElement('div')
    spacer.style.height = '320px'
    document.getElementById(id)!.before(spacer)
  }, href!.slice(1))
  await expect
    .poll(() =>
      page.evaluate(
        (id) => document.getElementById(id)!.getBoundingClientRect().top,
        href!.slice(1),
      ),
    )
    .toBeLessThan(115)
  await page.mouse.move(700, 500)
  await page.mouse.wheel(0, 400)
  await expect
    .poll(() =>
      page.evaluate(
        (id) => document.getElementById(id)!.getBoundingClientRect().top,
        href!.slice(1),
      ),
    )
    .toBeLessThan(-100)
  await page.locator('.reading-tools').getByRole('link', { name: '开始阅读' }).click()
  await expect(page.locator('#article-body')).toBeFocused()
  const source = page.locator('.reading-tools').getByRole('link', { name: '参考资料' })
  const sourceHref = await source.getAttribute('href')
  await source.click()
  await expect
    .poll(() => page.evaluate(() => document.activeElement?.id))
    .toBe(sourceHref!.slice(1))
})

test('mobile outline collapses after a jump and filtering resets on navigation', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(article)
  const toggle = page.getByRole('button', { name: /本页目录/ })
  await toggle.click()
  await page.getByRole('searchbox', { name: '查找本页小节' }).fill('Context')
  const target = page.locator('#article-outline a').first()
  const href = await target.getAttribute('href')
  await target.click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await expect
    .poll(() => page.evaluate(() => document.activeElement?.id))
    .toBe(href!.slice(1))
  await expect
    .poll(() =>
      page.evaluate(
        (id) => Math.round(document.getElementById(id)!.getBoundingClientRect().top),
        href!.slice(1),
      ),
    )
    .toBe(110)
  await page.locator('.document-nav .next').click()
  await toggle.click()
  const filter = page.getByRole('searchbox', { name: '查找本页小节' })
  if (await filter.count()) await expect(filter).toHaveValue('')
})

test('invalid or unavailable local storage leaves reading usable', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('kb-reading-size', '10000'))
  await page.goto(article)
  await expect(page.locator('#article-body .markdown-body')).toHaveCSS(
    'font-size',
    '16px',
  )
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error('Storage disabled')
    }
    Storage.prototype.setItem = () => {
      throw new Error('Storage disabled')
    }
  })
  await page.reload()
  await page.getByRole('button', { name: '正文字号 18', exact: true }).click()
  await expect(page.locator('#article-body .markdown-body')).toHaveCSS(
    'font-size',
    '18px',
  )
})
