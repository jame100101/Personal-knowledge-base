import { expect, test } from '@playwright/test'
import { slugify } from '../../app/utils/slug'

test('home, sidebar and course directory follow a beginner learning order', async ({
  page,
}) => {
  test.setTimeout(60_000)
  await page.goto('/')
  await expect(page.locator('main .folder-card h3')).toHaveText([
    '语言基础',
    '软件工程',
    '前端架构',
    '后端知识',
    'Java开发',
    'Agent开发',
  ])
  await page.locator(`main a[href="/knowledge/${slugify('软件工程')}"]`).click()
  await expect(page.locator('main h1')).toHaveText('软件工程')
  const entries = page.locator('.learning-order > a')
  await expect(entries).toHaveCount(10)
  await expect(entries.first()).toContainText('学习路线')
  await expect(entries.last()).toContainText('推荐阅读')
  await expect(entries.nth(1)).toContainText('从一个小功能开始')
  await expect(entries.nth(8)).toContainText('把全过程做一遍')
  const tree = page
    .locator('.folder-tree > li')
    .filter({
      has: page.locator(`.tree-row > a[href="/knowledge/${slugify('软件工程')}"]`),
    })
  await expect(tree.locator(':scope > .tree-children > li').first()).toContainText(
    '学习路线',
  )
  for (const width of [390, 820, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      )
      .toBe(true)
  }
  await entries.first().click()
  await expect(page.locator('.markdown-body h1')).toContainText('软件工程学习路线')
  await expect(page.locator('.markdown-body')).toContainText(
    '先看到问题，再认识方法和术语',
  )
})
