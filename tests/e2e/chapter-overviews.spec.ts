import { expect, test } from '@playwright/test'
import chapters from '../../app/data/chapter-overviews.json' with { type: 'json' }
import { slugify } from '../../app/utils/slug'

for (const id of [
  'software-engineering',
  'fe-vue',
  'java-electives',
  'agent-browser',
]) {
  const chapter = chapters.find((item) => item.id === id)!
  test(`chapter overview, route and image: ${id}`, async ({ page }) => {
    await page.goto('/knowledge/' + chapter.key.split('/').map(slugify).join('/'))
    const overview = page.locator('.chapter-overview')
    await expect(overview).toContainText(chapter.summary)
    await expect(overview.locator('img')).toHaveAttribute('src', chapter.image)
    await expect
      .poll(() =>
        overview.locator('img').evaluate((img) => img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0),
      )
      .toBe(true)
    const diagram = overview.locator('svg.flowchart')
    await expect(diagram).toBeVisible()
    for (const label of chapter.modules) await expect(diagram).toContainText(label)
    await overview.locator('.mermaid-open-button').click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await page.setViewportSize({ width: 390, height: 844 })
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      )
      .toBe(true)
  })
}

test('chapter introduction appears on its first article without changing article headings', async ({
  page,
}) => {
  await page.goto('/knowledge/' + slugify('软件工程'))
  await page.locator('.learning-order > a').first().click()
  await expect(page.locator('.chapter-overview')).toHaveCount(1)
  await expect(page.locator('.markdown-body')).toHaveCount(1)
  await expect(page.locator('.markdown-body h1')).toContainText('软件工程学习路线')
  await page.locator('.document-nav .next').click()
  await expect(page.locator('.chapter-overview')).toHaveCount(0)
})
