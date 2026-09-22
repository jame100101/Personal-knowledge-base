import { expect, test } from '@playwright/test'

test('backend curriculum is discoverable with reading first and seven sections', async ({
  page,
}) => {
  await page.goto('/')
  await page.locator('main a[href="/knowledge/backend-knowledge"]').click()
  await expect(page.locator('main h1')).toHaveText('后端知识')
  await expect(page.locator('.child-grid > a')).toHaveCount(7)
  await expect(page.locator('.document-list > a').first()).toContainText('推荐阅读')
  await page.locator('.document-list > a').first().click()
  await expect(page.locator('.markdown-body h1')).toContainText('推荐阅读')
  for (const width of [390, 820, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      )
      .toBe(true)
  }
})
