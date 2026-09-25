import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { chromium, expect } from '@playwright/test'
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
})
const base = process.env.FRONTEND_LAB_URL || 'http://127.0.0.1:5173'
await fs.mkdir('.tools/frontend/screenshots', { recursive: true })
try {
  for (const framework of ['vue', 'react']) {
    const page = await browser.newPage()
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`${base}/${framework}.html`)
    await expect(page.getByRole('listitem')).toHaveCount(2)
    await page.getByLabel('搜索文章').fill('  REACT ')
    await expect(page.getByRole('listitem')).toHaveCount(1)
    await expect(page.getByRole('listitem')).toContainText('React 状态入门')
    await page.getByLabel('搜索文章').fill('不存在')
    await expect(page.getByText('没有匹配的文章，换个词试试。')).toBeVisible()
    await page.getByLabel('搜索文章').fill('')
    await page.getByLabel('只看收藏').check()
    await expect(page.getByRole('listitem')).toHaveCount(1)
    await page.getByRole('button', { name: '收藏 React 状态入门' }).click()
    await expect(page.getByRole('listitem')).toHaveCount(0)
    await page.getByLabel('只看收藏').uncheck()
    await page.getByRole('button', { name: '收藏 Vue 响应式入门' }).click()
    await expect(
      page.getByRole('button', { name: '收藏 Vue 响应式入门' }),
    ).toHaveAttribute('aria-pressed', 'true')
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 900 })
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      )
      await page.screenshot({
        path: `.tools/frontend/screenshots/${framework}-${width}.png`,
      })
    }
    assert.deepEqual(errors, [])
    console.log(`${framework}: search, empty, favorites, 390/1280px and console passed`)
    await page.close()
  }
} finally {
  await browser.close()
}
