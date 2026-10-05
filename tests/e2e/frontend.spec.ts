import { expect, test } from '@playwright/test'
import { slugify } from '../../app/utils/slug'

test('frontend curriculum is reachable from home with learning route first and eight sections', async ({
  page,
}) => {
  test.setTimeout(60_000)
  await page.goto('/')
  await page.locator(`main a[href="/knowledge/${slugify('前端架构')}"]`).click()
  await expect(page.locator('main h1')).toHaveText('前端架构')
  await expect(page.locator('.learning-order > a')).toHaveCount(10)
  await expect(page.locator('.document-list > a').first()).toContainText('学习路线')
  await expect(page.locator('.document-list > a').last()).toContainText('推荐阅读')
  await page.locator('.document-list > a').first().click()
  await expect(page.locator('.markdown-body h1')).toContainText('学习路线')
  await expect(page.locator('.markdown-body')).toContainText('从网页基础开始')
  for (const width of [390, 820, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      )
      .toBe(true)
  }
})
